import * as path from 'path';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import {ServiceResponse} from './api/common/response'
import {HFCServiceImpl} from './api/service/hfcservice'
import {AuthentionService} from './api/service/authservice'
import {MockAadhaarService} from './api/service/mockaadhaarservice'



// Creates and configures an ExpressJS web server.
class Service {

  // ref to Express instance
  public express: express.Application;

  //Run configuration methods on the Express instance.
  constructor() {
    this.express = express();
    this.middleware();
    this.routes();
  }

  // Configure Express middleware.
  private middleware(): void {
    //this.express.use(logger('dev'));
    this.express.use(this.allowCROSDoaminRequest);
    this.express.use(bodyParser.json({type:"application/json"}));
    this.express.use(bodyParser.urlencoded({ extended: false }));
  }
  // Adding CROS headers 
  private allowCROSDoaminRequest(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else {
      next();
    }
};

  // Configure API endpoints.
  private routes(): void {
    /* This is just to get up and running, and to make sure what we've got is
     * working so far. This function will change when we start to add more
     * API endpoints */
    let router = express.Router();
    // placeholder route handler
    router.get("/", (req, res, next) => {
      res.json(new ServiceResponse('Success','Service available'));
    });
    this.express.use('/', router);
    this.express.use('/api/',(new HFCServiceImpl()).getRouter())
    this.express.use('/auth/',(new AuthentionService()).getRouter())
    this.express.use('/aadhaar/',(new MockAadhaarService()).getRouter())
    
    
    
  }

}

export default new Service().express;

