import * as fs from 'fs';
import * as path from 'path';
import * as log4js from 'log4js';
import {HFCClient,ChainCodeResponse} from '../../hfcutil/hfcclient'
var _LOGGER = log4js.getLogger('HFClientManager');

/**
 * This class acts as an utility to acess Hyperledger functions
 */
export class HFCClientManager{

    //Following variable stores the cluent instances for organizations

    private clientMap:any={}

    constructor(configPath:string, credentialStorePath:string,userCredentialPath:string){
        _LOGGER.info("PATH NAME "+__dirname)
        _LOGGER.info(`Credential path : ${configPath}`)
        let networkConfigStr = fs.readFileSync(path.join(__dirname, configPath));
        let networkConfig = JSON.parse(Buffer.from(networkConfigStr).toString())['network-config']
        let orderers: object[] = networkConfig['orderer']
        let orgnames:string[] = this.getOrgsList(networkConfig)
        orgnames.forEach((org)=>{
            _LOGGER.info(`Initialzing the org ${org}`)
            this.initOrg(networkConfig[org],org,orderers,credentialStorePath,userCredentialPath)
        })
    }
   
    private  initOrg(config:any,orgname:string, ordererConfig:object[],credentialStorePath:string,userCredentialPath:string){
        this.clientMap[orgname] = new HFCClient(orgname,config,ordererConfig,credentialStorePath,"",userCredentialPath,false)
        
    }
    /**
     * Read the org names from the network configurations
     * @param networkConfig network config
     */
    private getOrgsList(networkConfig:any):string[]{
        let orgs = new Array()
        for( var key in networkConfig){
            if (key != "orderer"){
                orgs.push(key)
            }
        }
        return orgs
    }
    /**
     * Initializes the client configurations 
     */
    public async initializeClients():Promise<boolean>{
        let isSuccess = false
        try{
            let allSuccess = true
            for(var org in this.clientMap){
                var client:HFCClient = this.clientMap[org]
                _LOGGER.info(`Initializing the org ${org} `)
                var rslt = await client.init()
                _LOGGER.info(`Initialization status for the org ${org} is ${rslt} `)
                allSuccess = allSuccess && rslt
            }
            isSuccess = allSuccess
        }catch(exp){
            console.log("Initialization of clients failed")
        }
        console.log(`Return result ${isSuccess}`)
        return isSuccess
    }
    /**
     * Perform a chain code invocation
     * @param channelId string
     * @param chainId  String
     * @param funcName String 
     * @param args arguments as array of objects
     * @param org  Node organization 
     * @param role Role of the user to invoke the method
     */
    public async invokeTransaction(channelId:string,chainId:string,funcName:string,args:object[],org:string,role:string):Promise<ChainCodeResponse>{
        var client : HFCClient = this.clientMap[org]
        _LOGGER.info(`Invoke Trxn: Channel name: ${channelId}`)
        _LOGGER.info(`Invoke Trxn: Chain code Id : ${chainId}`)
        _LOGGER.info(`Invoke Trxn: Funtion name: ${funcName}`)
        var argSTR = JSON.stringify(args,null,'  ')
        _LOGGER.info(`Invoke Trxn: Args : ${argSTR}`)
        _LOGGER.info(`Invoke Trxn: Org name: ${org}`)
        _LOGGER.info(`Invoke Trxn: User role: ${role}`)
        
        
        var trxnResult = await client.invokeChainCode(channelId,chainId, funcName,args,org+"_"+role);
        return new Promise<ChainCodeResponse>((resolve)=>resolve(trxnResult))
    }
    /**
     * Perform a chain code query
     * @param channelId string
     * @param chainId string
     * @param funcName string 
     * @param args array to password query method argument
     * @param org  Node organization 
     * @param role Role of the user to invoke the method
     */
    public async query(channelId:string,chainId:string,funcName:string,args:object[],org:string,role:string):Promise<any>{
        var client : HFCClient = this.clientMap[org]
        var argSTR = JSON.stringify(args,null,'  ')
        _LOGGER.info(`Invoke Trxn: Args : ${argSTR}`)
        _LOGGER.info(`Invoke Trxn: Org name: ${org}`)
        _LOGGER.info(`Invoke Trxn: User role: ${role}`)
        var trxnResult = await client.queryChaincode(channelId,chainId, funcName,args,org+"_"+role);
        return new Promise<any>((resolve)=>resolve(trxnResult))
    }
}