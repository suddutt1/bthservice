import { Router, Request, Response, NextFunction } from 'express';
import { ServiceResponse } from '../common/response'

import  *  as fs from 'fs'

import * as log4js from 'log4js';
var _LOGGER = log4js.getLogger('MockAadhaarServiceLogger');

export class MockAadhaarService {
    private router: Router
    private static userMap:any = {}
    /**
     * Constructor
     *
     */
    constructor() {
        this.router = Router();
        this.init();
    }

    /**
     * Intialize the routes
     */
    public init() {

        this.router.get('/aadhaarinfo/:ano', this.getAadharInfo);
       

    }
    /**
     * Retrives  aadhar for the input user  
     * @param req Request
     * @param res Response
     * @param next NextFunction
     */
    private async getAadharInfo(req: Request, res: Response, next: NextFunction) {
        let serviceStat = 200
        let servResp: ServiceResponse
        try {
            let ano = req.param("ano","")
            
            
            if (ano!="") {

                MockAadhaarService.loadUserMap()
                let userDetails = MockAadhaarService.getDetails(ano)

                if(userDetails !=null)
                {
                    
                    servResp = new ServiceResponse("Success", "User autheticated successfully", userDetails);
                } else {
                    serviceStat = 301
                    servResp = new ServiceResponse("Error", "Data not found", "Invalid aadhaar number");
                }

            } else {
                serviceStat = 300
                servResp = new ServiceResponse("Input Error", "Invalid inputs provided");
            }
        } catch (exp) {
            _LOGGER.error("Error in record retrival", exp)
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
            var content = fs.readFileSync(__dirname+"/../../../aadhaarrecords.json","UTF-8")
            var users:Object[] =JSON.parse(content)
            users.forEach(user => {
                this.userMap[user["patientAadharNo"]]= user
            });

        }
    }
    /**
     * Retrives a user details 
     * @param aadharno  string 
     */
    static getDetails(aadharno:string) :any{
        let userDetails = this.userMap[aadharno]
        if(userDetails!=null){
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