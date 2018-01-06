
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as copService from 'fabric-ca-client/lib/FabricCAClientImpl';
import * as CAUser from 'fabric-ca-client/lib/User';
import * as ApplicationUser from 'fabric-client/lib/User';
import * as HFC from 'fabric-client';

/**
 * A typescript based wrapper for CAClient. 
 * Each CAClient is tied with only one organization
 */

export class CAClient {
    private caClient: any
    private caUrl: string
    private caAdminUser: CAUser
    private adminUserId: string
    private adminSecret: string
    private mspId: string
    private orgId: string

    constructor(caUrl: string, adminUserId: string, adminSecret: string, mspId: string, orgId: string) {
        this.caUrl = caUrl;
        this.caClient = new copService(caUrl)
        this.adminUserId = adminUserId
        this.adminSecret = adminSecret
        this.mspId = mspId
        this.orgId = orgId
    }
    /**
     * Initialize the client, It enrolls the admin user
     */
    public async init(): Promise<boolean> {
        let isSucces = false
        try {
            let enrollmentResult = await this.caClient.enroll({
                enrollmentID: this.adminUserId,
                enrollmentSecret: this.adminSecret
            })
            console.log("Enrollment successful ")
            //console.log(enrollmentResult);
            this.caAdminUser = new CAUser({ enrollmentID: this.adminUserId, affiliation: this.orgId });
            var enc = await this.caAdminUser.setEnrollment(enrollmentResult.key, enrollmentResult.certificate, this.mspId);
            isSucces = true;
        } catch (exp) {
            console.log("Error init " + exp)
            isSucces = false;
        }
        return new Promise<boolean>(resolve => {
            return resolve(isSucces)
        })
    }
    /**
     * Registers an user id and returns the secret 
     */

    public async register(userId: string, secret: string): Promise<boolean> {
        let registerRequest = {
            enrollmentID: userId,
            role: 'client',
            affiliation: this.orgId,
            maxEnrollments: 1,
            attrs: [],
            enrollmentSecret: secret
        };
        let isSuccess: boolean = false
        try {
            if (this.caAdminUser !== null && this.caAdminUser.isEnrolled()) {
                let enrollmentSecret = await this.caClient.register(registerRequest, this.caAdminUser)
                console.log(`User ${userId} registration successful`);
                var caUser = new CAUser({ enrollmentID: userId, affiliation: this.orgId })
                isSuccess = (enrollmentSecret === secret)

            } else {
                console.log("Admin not registered ...")
            }

        } catch (exp) {
            console.log(`Not able to register user ${userId}`, exp)
            isSuccess = false;
        }
        return new Promise<boolean>(resolve => {
            return resolve(isSuccess)
        })
    }
    /**
     * Enrollment of a user with the CA. If not registered user will be registerd
     * @param userid string
     * @param secret string
     */
    public async loginUser(userid: string, secret: string): Promise<ApplicationUser> {

        let isSucess = false;

        //First try to enroll the user 
        let enrolledUser = await this.enrollUser(userid,secret);
        if(enrolledUser === null){
            //Try to register him
            let isRegistered = await this.register(userid,secret)
            if(isRegistered){
                //Try to enroll now
                enrolledUser = await this.enrollUser(userid,secret);
            }else{
                console.log(`Unable to register user ${userid} `)
            }
        }
        return new Promise<ApplicationUser>((resolve) => {
            return resolve(enrolledUser)
        })
    }
    /**
     * Enrolls a user
     * @param userid string
     * @param secret string
     */
    private async enrollUser(userid: string, secret: string): Promise<ApplicationUser> {
        let appUser: ApplicationUser = null;
        try {
            
            let enrollmentResult = await this.caClient.enroll({
                enrollmentID: userid,
                enrollmentSecret: secret
            })
            console.log("Enrollment successful ")
            //console.log(enrollmentResult);
            appUser = new ApplicationUser({ enrollmentID: userid, affiliation: this.orgId });
            var enc = await appUser.setEnrollment(enrollmentResult.key, enrollmentResult.certificate, this.mspId);

        } catch (exp) {
            console.log(`Error in enrollng the user ${userid}`)
        }
        return new Promise<ApplicationUser>((resolve) => {
            return resolve(appUser)
        });
    }
/**
     * Enrolls a user
     * @param userid string
     * @param secret string
     */
    public async enrollUserX(userid: string, secret: string,client:HFC): Promise<ApplicationUser> {
        let appUser: ApplicationUser = null;
        try {
            
            let enrollmentResult = await this.caClient.enroll({
                enrollmentID: userid,
                enrollmentSecret: secret
            })
            console.log("Enrollment successful ")
            //console.log(enrollmentResult);
            appUser = new ApplicationUser({ enrollmentID: userid, affiliation: this.orgId },client);
            var enc = await appUser.setEnrollment(enrollmentResult.key, enrollmentResult.certificate, this.mspId);

        } catch (exp) {
            console.log(`Error in enrollng the user ${userid}`)
        }
        return new Promise<ApplicationUser>((resolve) => {
            return resolve(appUser)
        });
    }
}