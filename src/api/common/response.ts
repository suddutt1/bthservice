export class ServiceResponse{
    public Status:string
    public Message:string
    public Payload:any
    public TimeStamp:Date

    constructor(status:string,message:string,payload?:any){
        this.Status = status
        this.Message = message
        this.Payload = payload
        this.TimeStamp = new Date()
    } 
}