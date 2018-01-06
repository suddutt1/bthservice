import { Router, Request, Response, NextFunction } from 'express';
import { ServiceResponse } from '../common/response'

import  *  as fs from 'fs'

import * as log4js from 'log4js';
var _LOGGER = log4js.getLogger('AuthenticationServiceLogger');

export class AuthentionService {
    private router: Router
    private static userMap:any = {}
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

        this.router.post('/authenticate', this.authenticate);
       

    }
    /**
     * Authenticates a user  
     * @param req Request
     * @param res Response
     * @param next NextFunction
     */
    private async authenticate(req: Request, res: Response, next: NextFunction) {
        let serviceStat = 200
        let servResp: ServiceResponse
        try {
            let postBody = req.body
            let rootDoc = JSON.parse(JSON.stringify(postBody))
           
            let uid = rootDoc.userId
            let pwd = rootDoc.password
            if (uid != null && pwd != null) {

                AuthentionService.loadUserMap()
                let userDetails = AuthentionService.authenticate(uid,pwd)

                if(userDetails !=null)
                {
                    var retUserDetails = JSON.parse(JSON.stringify(userDetails))
                    retUserDetails["password"]="masked"
                    servResp = new ServiceResponse("Success", "User autheticated successfully", retUserDetails);
                } else {
                    serviceStat = 301
                    servResp = new ServiceResponse("Error", "Authentication failure", "Invalid user id or password");
                }

            } else {
                serviceStat = 300
                servResp = new ServiceResponse("Input Error", "Invalid inputs provided");
            }
        } catch (exp) {
            _LOGGER.error("Error in authentication", exp)
            serviceStat = 501
            servResp = new ServiceResponse("Error", exp + "")
        }
        res.status(serviceStat).send(servResp)
    }
    /**
     * Loads the user map
     */
    static loadUserMap(){
        var userLoaded : boolean=false
        for (var userId in this.userMap){
            userLoaded= true
        }
        if(!userLoaded){
            //Load the users
            _LOGGER.info(__dirname)
            var content = fs.readFileSync(__dirname+"/../../../users.json","UTF-8")
            var users:Object[] =JSON.parse(content)
            users.forEach(user => {
                this.userMap[user["uid"]]= user
            });

        }
    }
    /**
     * Authenticate a usr
     * @param userId  string 
     * @param password  string
     */
    static authenticate(userId:string, password:string) :any{
        let userDetails = this.userMap[userId]
        if(userDetails!=null && userDetails["password"]==password){
            return userDetails
        }
        return null 
    }
    /**
     * Returns the router object
     */
    public getRouter(): Router {
        return this.router;
    }
}