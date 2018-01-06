import { Router, Request, Response, NextFunction } from 'express';
import { ServiceResponse } from '../common/response'
import { HFCClientManager } from '../util/hfcclientmgr'
import { ChainCodeResponse } from '../../hfcutil/hfcclient'

import * as log4js from 'log4js';

var _LOGGER = log4js.getLogger('POServiceLogger');
/**
 * Purchage order service implementation
 */
export class HFCServiceImpl {
    private router: Router
    
    static hfcClientManager: HFCClientManager
    
    /**
     * Constructor
     * TODO: Pass the HFCClient object instance 
     */
    constructor() {
        this.router = Router();
        this.init();
    }
    /**
     * Intialize the routes
     */
    public init() {

        this.router.post('/invoke', this.invoke);
        this.router.post('/query', this.query);
        this.router.put("/init",this.initHFC)
    }
    
    /**
     * Invoke a chain code transaction that is not a query  
     * @param req Request
     * @param res Response
     * @param next NextFunction
     */
    private async invoke(req: Request, res: Response, next: NextFunction) {
        let serviceStat = 200
        let servResp: ServiceResponse
        try {
            let postBody = req.body
            let rootDoc= JSON.parse(JSON.stringify(postBody))
            _LOGGER.info(`Invoke postbody ${postBody}` )
            let channel = rootDoc.channel
            let ccid = rootDoc.ccid
            let method = rootDoc.fn 
            let org = rootDoc.org
            let role = rootDoc.invokerRole
            let chainCodeArgs  = rootDoc.args

            if (channel!=null && ccid!=null && method!=null && org!=null && role!=null && chainCodeArgs!=null && chainCodeArgs instanceof Array ){
                var invokeResult = await HFCServiceImpl.invokeTransaction(channel,ccid,method,org,role,chainCodeArgs)
                if(invokeResult.isSuccess){
                    servResp = new ServiceResponse("Success", "Chain code invoke completed successfully", invokeResult);
                }else{
                    serviceStat=301
                    servResp = new ServiceResponse("Error", "Unable to complete invoke chain code ",invokeResult.result);
                }

            }else{
                serviceStat = 300
                servResp = new ServiceResponse("Input Error", "Invalid inputs provided");
            }
        } catch (exp) {
            _LOGGER.error("Err in invoking chain code list", exp)
            serviceStat = 501
            servResp = new ServiceResponse("Error", exp + "")
        }
        res.status(serviceStat).send(servResp)
    }
    /**
     * Executes a chain code query 
     * @param req Request
     * @param res  Response
     * @param next  NextFunction
     */
    private async query(req: Request, res: Response, next: NextFunction) {
        let serviceStat = 200
        let servResp: ServiceResponse
        try {
            let postBody = req.body
            let rootDoc= JSON.parse(JSON.stringify(postBody))
            _LOGGER.info("Query Transaction invoked ",postBody)
            let channel = rootDoc.channel
            let ccid = rootDoc.ccid
            let method = rootDoc.fn 
            let org = rootDoc.org
            let role = rootDoc.invokerRole
            let chainCodeArgs  = rootDoc.args
            
            if (channel!=null && ccid!=null && method!=null && org!=null && role!=null && chainCodeArgs!=null && chainCodeArgs instanceof Array){
                var results = await HFCServiceImpl.queryTransaction(channel,ccid,method,org,role,chainCodeArgs)
                if(results!=null && results.length>0){
                    servResp = new ServiceResponse("Success", "Chain code query completed successfully", results);
                }else{
                    
                    servResp = new ServiceResponse("Error", "Unable to invoke chain code query");
                }

            }else{
                serviceStat = 300
                servResp = new ServiceResponse("Input Error", "Invalid input provided");
            }
        } catch (exp) {
            _LOGGER.error("Err in query chain code", exp)
            serviceStat = 501
            servResp = new ServiceResponse("Error", exp + "")
        }
        res.status(serviceStat).send(servResp)

    }

    
    /**
     * Hidden method for HFC initialization testing
     * @param req Request
     * @param res Response
     * @param next NextFunction
     */
    private async initHFC(req: Request, res: Response, next: NextFunction) {
        let serviceStat = 200
        let servResp: ServiceResponse
        try {
            //var rslt = await POServiceImpl.insertPO({})
          
                var isInitiazed = await HFCServiceImpl.initHFCMananger()
                if(isInitiazed){
                    servResp = new ServiceResponse("Success", "HFC Initialized Successfully", isInitiazed);
                }else{
                    serviceStat=301
                    servResp = new ServiceResponse("Error", "HFC Initialized Failure");
                }

          
        } catch (exp) {
            _LOGGER.error("Err in HFC Initializationt", exp)
            serviceStat = 501
            servResp = new ServiceResponse("Error", exp + "")
        }
        res.status(serviceStat).send(servResp)

    }
    /**
     * Invokes the chain code
     * @param channel channel name
     * @param ccid chain code id
     * @param method function to invoke
     * @param org organization . Chain code would be invoked on the peers of this organization
     * @param usrRole user role
     * @param chainCodeArgs [] ( array of chain code arguments)
     */
    private static async invokeTransaction(channel:string,ccid:string,method:string,org:string,usrRole:string,chainCodeArgs:Object[]): Promise<ChainCodeResponse> {
        if (this.hfcClientManager == null) {
            await this.initHFCMananger()
        }
        if (this.hfcClientManager != null) {
            var invokeResult = await this.hfcClientManager.invokeTransaction(channel,ccid,method,chainCodeArgs,org, usrRole)
            _LOGGER.info(`Invoke result ${invokeResult}` )
            return invokeResult
        }
        return new ChainCodeResponse(false,"Configuration error","Configuration error")
    }
    /**
     * Invokes query method on the chanin code
     * @param channel channel name
     * @param ccid chain code id
     * @param method function to invoke
     * @param org organization . Chain code would be invoked on the peers of this organization
     * @param usrRole user role
     * @param chainCodeArgs [] ( array of chain code arguments)
     */

    private static async queryTransaction(channel:string,ccid:string,method:string,org:string,usrRole:string,chainCodeArgs:Object[]): Promise<Object[]> {
        if (this.hfcClientManager == null) {
            await this.initHFCMananger()
        }
        if (this.hfcClientManager != null) {
            var results = await this.hfcClientManager.query(channel,ccid,method,chainCodeArgs,org,usrRole)

            _LOGGER.debug(`Retrived  result ${results} `)
            if( results !=null && results instanceof Array){
                _LOGGER.debug("Returning as Array")
                return results
            }else if (results !=null)
            {
                var actualObject = JSON.parse(JSON.stringify(results))
                if( actualObject instanceof Array){
                    _LOGGER.debug("Returning as Array after conversion")
                    return actualObject
                }else{
                    var resultArray = new Array()
                    resultArray.push(actualObject)
                    _LOGGER.debug("Returning as Array after inserting output object into array")
                    return resultArray
                }
            }
            
        }
        return new Array()
    }
    /**
     * Initialze the HFC Client manager
     */

    
    private static async initHFCMananger(): Promise<boolean> {
        let isDone = false
        if (this.hfcClientManager == null) {
            let basePath="../../../"
            this.hfcClientManager = new HFCClientManager(basePath+"network-config.json","~/credstore","../../user-cred-config.json")
            isDone = await this.hfcClientManager.initializeClients()
            if (!isDone) {
                _LOGGER.error("Unable to start the dbConnector ")
                this.hfcClientManager == null
            }
        }
        return isDone
    }

    /**
     * Returns the router object
     */
    public getRouter(): Router {
        return this.router;
    }
}

