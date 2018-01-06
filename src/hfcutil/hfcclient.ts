
import * as fs from 'fs';
import * as path from 'path';
import * as HFC from 'fabric-client';
import * as Channel from 'fabric-client/lib/Channel'
import * as EventHub from 'fabric-client/lib/EventHub';
import * as ApplicationUser from 'fabric-client/lib/User';

import * as  log4js from 'log4js';

import { CAClient } from './caclient';

export class ChainCodeResponse{
    isSuccess : boolean = false
    message: string=""
    result: any
    constructor(success:boolean,msg:string,result:any){
        this.isSuccess = success
        this.message = msg
        this.result= result
    } 
}

/**
 * Hyperledger Fabic HFC client wrapper . One client is tied with only one organization
 */
export class HFCClient {
    private orgId: string
    private org: string
    private mspId: string
    private client: HFC
    private adminUser: ApplicationUser
    private organizationConfig: any
    private ordererConfig: any[]
    //private peerMap: any = {}
    //private ordererList: Object[] = new Array()
    private logger = log4js.getLogger('HFClient');
    private credStoragePath: string
    private channelMap: any = {}
    private useCAForUserAuth: boolean = false
    private caClient: CAClient = null

    private gopath: string = null
    private userCredentialPath:string = null
    /**
     * 
     * @param orgConfig Peer config for the organization
     * @param ordererConfig Configration of orderer in an array . 
     * @param credPath Strorage path for the ceredentials
     * @param caClient CACLient instance ( Assumption is it it initialized)
     * @param chainCodePath Path to chaincode to be installed . Do not include src directory
     */

    constructor(orgId, orgConfig: any, ordererConfig: any[], credStorePath: string, chainCodePath: string, userCredentialPath:string,useCAForAuth: boolean) {
        this.orgId = orgId
        this.org = orgConfig.name
        this.mspId = orgConfig.mspid
        this.organizationConfig = orgConfig
        this.ordererConfig = ordererConfig
        this.credStoragePath = credStorePath + "_" + this.org
        this.gopath = chainCodePath
        this.useCAForUserAuth = useCAForAuth
        this.userCredentialPath = userCredentialPath
    }
    /**
     * Initialization 
     */
    public async init(): Promise<boolean> {

        let isSuccess = false;
        try {
            process.env.GRPC_SSL_CIPHER_SUITES = "ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-ECDSA-AES256-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384"
            
            HFC.setLogger(this.logger)
            this.client = new HFC()

            let cryptoSuite = HFC.newCryptoSuite()
            cryptoSuite.setCryptoKeyStore(HFC.newCryptoKeyStore({ path: this.credStoragePath }));
            this.client.setCryptoSuite(cryptoSuite);
            var store = await HFC.newDefaultKeyValueStore({
                path: this.credStoragePath + "_x"
            })
            this.client.setStateStore(store)
            if (this.useCAForUserAuth) {
                var caURL = this.organizationConfig["ca"]
                this.caClient = new CAClient(caURL, "admin", "adminpw", this.organizationConfig["mspid"], this.orgId);
                //Initialize the CA
                isSuccess = await this.caClient.init()
            } else {
                isSuccess = true
            }
        } catch (exp) {
            this.logger.error(`Error in Client intiiatization for ${this.org}`, exp);
            isSuccess = false;
        }
        return new Promise<boolean>((resolve) => { resolve(isSuccess) })
    }



    /**
     * Creates a new channel 
     * @param channelId Channel name
     * @param channelConfigPath Channel file (tx) path. This file must be generated using configtx tool
     */
    public async createChannel(channelId: string, channelConfigPath: string): Promise<boolean> {
        let isSuccess = false;
        try {
            var isAdminRetrived = await this.getOrgAdmin()
            if (isAdminRetrived) {
                this.client.setUserContext(this.adminUser);
                var channel: Channel = this.client.newChannel(channelId)
                //Add the orderers
                this.setUpOrderers(channel);
                //Add all the peers
                this.setupPeers(channel);
                var envelopeData = fs.readFileSync(path.join(__dirname, channelConfigPath));
                //extract the channel config bytes from the envelope to be signed
                var channelConfig = this.client.extractChannelConfig(envelopeData)
                var signatures = []
                let signature = this.client.signChannelConfig(channelConfig);
                signatures.push(signature)
                let request = {
                    config: channelConfig,
                    signatures: signatures,
                    name: channelId,
                    orderer: channel.getOrderers()[0],
                    txId: this.client.newTransactionID()
                };

                var response = await this.client.updateChannel(request)
                await this.sleep(5000)
                isSuccess = (response.status === 'SUCCESS')
                if (isSuccess) {
                    this.channelMap[channelId] = channel
                }
            } else {
                this.logger.error("Unable to get the admin certificate")
            }
        } catch (exp) {
            this.logger.error(`Failed to create channel with id ${channelId} channel config path ${channelConfigPath}`, exp)
            isSuccess = false
        }
        return new Promise<boolean>((resolve) => { resolve(isSuccess) });
    }
    /**
     * Join a channel to the peers of this clients organization
     * @param channelId string
     */
    public async joinChannel(channelId: string): Promise<boolean> {
        let isSuccess = false;
        let channel: any = null;
        try {

            if (this.channelMap[channelId] != null) {
                this.logger.debug("Reading from map")
                channel = this.channelMap[channelId]
            } else {
                this.logger.debug("Creating new ")
                channel = this.client.newChannel(channelId)
                this.setUpOrderers(channel)
                this.setupPeers(channel)
                this.channelMap[channelId] = channel
            }
            var isAdminEnrolled = await this.getOrgAdmin()
            if (isAdminEnrolled) {
                this.client.setUserContext(this.adminUser)
                let tx_id = this.client.newTransactionID();
                let request = {
                    txId: tx_id
                };

                let genesisBlock = await channel.getGenesisBlock(request)
                var joinChannelRequest = {
                    targets: channel.getPeers(),
                    txId: tx_id,
                    block: genesisBlock
                };
                let joinChannelResult = await channel.joinChannel(joinChannelRequest);
                this.logger.debug(`Join channel result for ${channel} ${this.org}`, joinChannelResult)
                if (joinChannelResult[0] && joinChannelResult[0].response && joinChannelResult[0].response.status == 200) {
                    isSuccess = true;
                    this.logger.info(`Join channel with ${channelId} for ${this.org} is successful`)
                } else {
                    this.logger.error(`Join channel with ${channelId} for ${this.org} is not successful`)
                }
            } else {
                this.logger.error(`Join channel with ${channelId} for ${this.org} is not done for invalid  admin credentials`)
            }
        } catch (exp) {
            this.logger.error(`Error is join channel ${channelId}`, exp)
        }
        return new Promise<boolean>((resolve) => { resolve(isSuccess) });
    }
    /**
     * Install a chain code in peers associated 
     * @param chaincodeId string
     * @param chaincodePath  string
     * @param chaincodeVersion string
     */
    public async installChainCode(chaincodeId: string, chaincodePath: string, chaincodeVersion: string): Promise<boolean> {
        let isSuccess = false
        try {
            process.env.GOPATH = path.join(__dirname, this.gopath)
            var isAdminEnrolled = await this.getOrgAdmin()
            if (isAdminEnrolled) {
                var request = {
                    targets: this.setupPeers(null),
                    chaincodePath: chaincodePath,
                    chaincodeId: chaincodeId,
                    chaincodeVersion: chaincodeVersion
                };
                var response = await this.client.installChaincode(request);
                var proposalResponses = response[0];
                var proposal = response[1];
                var header = response[2];
                var all_good = true;
                for (var i in proposalResponses) {
                    let one_good = false;
                    if (proposalResponses && proposalResponses[0].response &&
                        proposalResponses[0].response.status === 200) {
                        one_good = true;
                        this.logger.info('Install proposal was good');
                    } else {
                        this.logger.error('Install proposal was bad');
                    }
                    all_good = all_good && one_good;
                }
                if (all_good) {
                    this.logger.info(`Successfully sent install Proposal and received ProposalResponse: Status - ${proposalResponses[0].response.status}`);
                    this.logger.debug(`Successfully Installed chaincode on organization ${this.org}`);
                    isSuccess = true
                } else {
                    this.logger.error(
                        `Failed to send install Proposal or receive valid response. Response null or status is not 200.`
                    );
                }
            } else {
                this.logger.error(`Error in chain code installaton ${chaincodeId} ${chaincodePath} ${chaincodeVersion} . Invalid admin `)
            }
        } catch (exp) {
            this.logger.error(`Error in chain code installaton ${chaincodeId} ${chaincodePath} ${chaincodeVersion}`, exp)
            isSuccess = false
        }

        return new Promise<boolean>((resolve) => { resolve(isSuccess) });
    }
    /**
     * Instantiate the chain code 
     * @param channelId string 
     * @param chaincodeId string
     * @param chaincodeVersion  string 
     * @param functionName string 
     * @param args object[]
     */
    public async instantiateChainCode(channelId: string, chaincodeId: string, chaincodeVersion: string, functionName: string, args: any[]): Promise<boolean> {
        let isSuccess = false
        let channel: any = null
        try {
            if (this.channelMap[channelId] != null) {
                this.logger.debug("Reading from map")
                channel = this.channelMap[channelId]
            } else {
                this.logger.debug("Creating new ")
                channel = this.client.newChannel(channelId)
                this.setUpOrderers(channel)
                this.setupPeers(channel)
                this.channelMap[channelId] = channel
            }
            var isAdminEnrolled = await this.getOrgAdmin()
            if (isAdminEnrolled) {
                this.client.setUserContext(this.adminUser)
                var initRslt = await channel.initialize()
                this.logger.debug(`Channel ${channelId} init result `, initRslt)
                if (initRslt != null) {
                    var tx_id = this.client.newTransactionID();
                    // send proposal to endorser
                    var request = {
                        chaincodeType: 'golang',
                        chaincodeId: chaincodeId,
                        chaincodeVersion: chaincodeVersion,
                        fcn: functionName,
                        args: args,
                        txId: tx_id
                    };

                    var results = await channel.sendInstantiateProposal(request);
                    var proposalResponses = results[0];
                    var proposal = results[1];
                    var header = results[2];
                    var all_good = true;
                    proposalResponses.forEach((peerResp, index) => {
                        let one_good = false;
                        this.logger.info('Proposal response ', peerResp)
                        if (peerResp && peerResp.response &&
                            peerResp.response.status === 200) {
                            one_good = true;
                            this.logger.info('Instantiate proposal was good');
                        } else {
                            this.logger.error('Instantiate proposal was bad');
                        }
                        all_good = all_good && one_good;
                    });
                    if (all_good) {
                        var commitRequest = {
                            proposalResponses: proposalResponses,
                            proposal: proposal,
                            header: header
                        };
                        var trxnResponse = await channel.sendTransaction(commitRequest)
                        this.logger.info(`Received transaction response `, trxnResponse)
                        isSuccess = (trxnResponse.status == 'SUCCESS')

                    } else {
                        this.logger.error(`Not all the transaction responses are good. `)
                    }

                }
            } else {
                this.logger.error('Admin not found for ${this.org}')
            }
        } catch (exp) {
            this.logger.error(`Error in chain code installation ${this.org}`, exp)
            isSuccess = false
        }
        return new Promise<boolean>((resolve) => { resolve(isSuccess) });
    }
    /**
     * Invoke chain code TODO: Return the result instead of boolean
     * @param channelId string 
     * @param chainCodeId  string 
     * @param functionName string name of the function to invoke
     * @param args object[] arguments to pass for invoke function
     * @param userId string user 
     */
    public async invokeChainCode(channelId: string, chainCodeId: string, functionName: string, args: any[], userId: string): Promise<ChainCodeResponse> {
        let ccResp:ChainCodeResponse 
        let channel: any = null
        try {
            if (this.channelMap[channelId] != null) {
                this.logger.debug("Reading from map")
                channel = this.channelMap[channelId]
            } else {
                this.logger.debug("Creating new ")
                channel = this.client.newChannel(channelId)
                this.setUpOrderers(channel)
                this.setupPeers(channel)
                this.channelMap[channelId] = channel
            }
            var targets = this.setupPeers(null)
            var appUser = await this.getUser(userId)
            if (appUser != null) {
                this.client.setUserContext(appUser)
                var tx_id = this.client.newTransactionID()
                var propRequest = {
                    targets: targets,
                    fcn: functionName,
                    args: args,
                    chaincodeId: chainCodeId,
                    txId: tx_id
                };
                var proposalRespRslt = await channel.sendTransactionProposal(propRequest);
                var proposalResponses = proposalRespRslt[0];
                var proposal = proposalRespRslt[1];
                var header = proposalRespRslt[2];
                var all_good = true;
                let errorMesg = ""
                proposalResponses.forEach((peerResp, index) => {
                    this.logger.info("Chcking proposal responses")
                    let one_good = false;
                    if (peerResp && peerResp.response &&
                        peerResp.response.status === 200) {
                        one_good = true;
                        this.logger.info('Transaction proposal was good');
                    } else {
                        this.logger.error("Error message ",peerResp.message)
                        errorMesg = peerResp.message
                        this.logger.error('Transaction proposal was bad');
                    }
                    all_good = all_good && one_good;
                })
                if (all_good) {
                    var trxnRequest = {
                        proposalResponses: proposalResponses,
                        proposal: proposal,
                        header: header
                    };
                    var trxnResponse = await channel.sendTransaction(trxnRequest)
                    var isSuccess = (trxnResponse.status == 'SUCCESS')
                    ccResp = new ChainCodeResponse(isSuccess,trxnResponse.status,trxnResponse.status  )
                    this.logger.info(`Transaction status `, trxnResponse)
                } else {
                    this.logger.error(`Not all the transaction proposal responses from peer is good for ${chainCodeId} function ${functionName} args ${args}`)
                    ccResp = new ChainCodeResponse(false,"Proposal was not successful",errorMesg)
                }

            } else {
                this.logger.error(`Application user ${userId} enrollment failure`)
                ccResp = new ChainCodeResponse(false,"User enrolment failure",userId)
            }
        } catch (exp) {
            this.logger.error(`Error in invoke chain code ${chainCodeId} on channel${channelId} for org ${this.org}`, exp)
            ccResp = new ChainCodeResponse(false,"Exception thrown",exp.message)

        }
        return new Promise<ChainCodeResponse>((resolve) => { resolve(ccResp) })
    }
    /**
     * Query an existing chain code
     * @param channelId string 
     * @param chaincodeId string 
     * @param functionName string function name to invoke
     * @param args object[] input params
     * @param userId string userid
     * @param secret string secret for enrollment
     */
    public async queryChaincode(channelId: string, chaincodeId: string, functionName: string, args: any[], userId: string): Promise<any> {
        let queryOutput = "XXX"
        let channel: any = null
        try {
            if (this.channelMap[channelId] != null) {
                this.logger.debug("Reading from map")
                channel = this.channelMap[channelId]
            } else {
                this.logger.debug("Creating new ")
                channel = this.client.newChannel(channelId)
                this.setUpOrderers(channel)
                this.setupPeers(channel)
                this.channelMap[channelId] = channel
            }

            var appUser = await this.getUser(userId)
            if (appUser != null) {
                this.client.setUserContext(appUser)
                var targets = this.setupPeers(null)
                for (var index = 0; index < targets.length; index++) {
                    var targetPeer = targets[index]
                    var tx_id = this.client.newTransactionID();
                    var queryRequest = {
                        chaincodeId: chaincodeId,
                        txId: tx_id,
                        fcn: functionName,
                        args: args
                    };
                    var queryResponse = await channel.queryByChaincode(queryRequest, targetPeer)
                    this.logger.debug(`Query response from ${index} peer `, queryResponse)
                    var isPeerDown = ((queryResponse[0].toString().indexOf('Connect Failed') > -1) || (queryResponse[0].toString().indexOf('REQUEST_TIMEOUT') > -1))
                    if (!isPeerDown) {
                        for (let i = 0; i < queryResponse.length; i++) {
                            this.logger.debug(queryResponse[i].toString('utf8'))
                            queryOutput = queryResponse[i].toString('utf8')
                            break;
                        }
                        break;
                    }
                }
            } else {
                this.logger.error(`Application user ${userId} enrollment failure`)
            }
        } catch (exp) {
            this.logger.error(`Query chain code failed ${chaincodeId} ${functionName} ${args}`, exp)
            queryOutput = "TRXN_FAILED"
        }
        return new Promise<any>((resolve) => { resolve(queryOutput) })
    }
    /**
 * Loads the org admin from the config details 
 */
    private async getUser(userId: string): Promise<ApplicationUser> {
        let usr: ApplicationUser = null
        try {
            if (this.useCAForUserAuth) {
                usr  = await this.caClient.loginUser(userId,this.readUserCredentials()[userId])
            } else {
                var credentialBaseDir = this.readUserCredentials()[userId]
                var keyPath = path.join(__dirname, credentialBaseDir + "/msp/keystore");
                var keyPEM = Buffer.from(this.readAllFiles(keyPath)[0]).toString();
                var certPath = path.join(__dirname, credentialBaseDir + "/msp/signcerts");
                var certPEM = this.readAllFiles(certPath)[0].toString();
                var enrolledUser = await this.client.createUser({
                    username: userId, mspid: this.mspId, cryptoContent: {
                        privateKeyPEM: keyPEM,
                        signedCertPEM: certPEM
                    }
                })
                if (enrolledUser != null) {
                    usr = enrolledUser
                }
            }

        } catch (exp) {
            this.logger.error(`Error in retriveing the org admin for ${this.org}`, exp)
        }
        return new Promise<ApplicationUser>((resolve) => { resolve(usr) });
    }
    /**
     * Loads the org admin from the config details 
     */
    private async getOrgAdmin(): Promise<boolean> {
        let isSuccess = false
        try {
            var admin = this.organizationConfig.admin;
            var keyPath = path.join(__dirname, admin.key);
            var keyPEM = Buffer.from(this.readAllFiles(keyPath)[0]).toString();
            var certPath = path.join(__dirname, admin.cert);
            var certPEM = this.readAllFiles(certPath)[0].toString();
            this.adminUser = await this.client.createUser({
                username: "peer" + this.org + "Admin", mspid: this.mspId, cryptoContent: {
                    privateKeyPEM: keyPEM,
                    signedCertPEM: certPEM
                }
            })

            isSuccess = (this.adminUser !== null)
        } catch (exp) {
            this.logger.error(`Error in retriveing the org admin for ${this.org}`, exp)
        }
        return new Promise<boolean>((resolve) => { resolve(isSuccess) });
    }
    private readUserCredentials(): any {
        this.logger.info(`User credential Path Search for ${this.org} base dir ${__dirname} ${this.userCredentialPath}` )
        let file_path = path.join(__dirname, this.userCredentialPath);
        let data = fs.readFileSync(file_path);
        let credentialMap = JSON.parse(Buffer.from(data).toString())
        return credentialMap
    }
    /**
     * Reads all the files from the input directory
     * @param dir string
     */
    private readAllFiles(dir: string): any[] {
        //console.log(`Reading the files from directory ${dir} `)
        var files = fs.readdirSync(dir);
        var certs = [];
        files.forEach((file_name) => {
            //console.log(`Reading the file from directory ${dir} ${file_name}`)
            let file_path = path.join(dir, file_name);
            let data = fs.readFileSync(file_path);
            certs.push(data);
        });
        return certs;
    }
    /**
     * Sleep a while
     * @param ms number milliseconds to sleep
     */
    private async sleep(ms: number): Promise<any> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Add the peers to the peer map. Will be used during channel creation
     */
    private setupPeers(channel: any): any[] {
        let peers: any[] = []
        for (let key in this.organizationConfig) {
            if (key.indexOf('peer') === 0) {
                let data = fs.readFileSync(path.join(__dirname, this.organizationConfig[key]['tls_cacerts']));
                let peer = this.client.newPeer(
                    this.organizationConfig[key].requests, {
                        pem: Buffer.from(data).toString(),
                        'ssl-target-name-override': this.organizationConfig[key]['server-hostname'],
                        'request-timeout': 5000000
                    }

                );
                //this.peerMap[this.organizationConfig[key]['server-hostname']] = peer
                if (channel != null) {
                    channel.addPeer(peer)
                }
                peers.push(peer)
            }
        }
        return peers
    }
    /**
     * Setup the orderes 
     * @param ordererConfig String
     */
    private setUpOrderers(channel: any) {
        for (let index in this.ordererConfig) {
            let data = fs.readFileSync(path.join(__dirname, this.ordererConfig[index]['tls_cacerts']));
            let newOrderer = this.client.newOrderer(
                this.ordererConfig[index].url, {
                    pem: Buffer.from(data).toString(),
                    'ssl-target-name-override': this.ordererConfig[index]['server-hostname'],
                    'request-timeout': 5000000
                }
            );
            channel.addOrderer(newOrderer)
        }
    }
}