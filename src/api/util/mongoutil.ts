import { MongoClient, Db, MongoClientOptions, Collection,UpdateWriteOpResult, InsertOneWriteOpResult , InsertWriteOpResult} from 'mongodb'
export class MongoUtil {
    private url: string = "mongodb://suddutt1:cnp4test@ds117495.mlab.com:17495/krogerdemo"
    private db: any = null
    constructor() {

    }
    public async init(): Promise<boolean> {
        var isSuccess = false;
        try {
            this.db = await MongoClient.connect(this.url)
            if (this.db != null) {
                isSuccess = true
                console.log("Connected to db " + this.url)
                console.log(this.db)
            }
        } catch (exp) {
            console.log(exp)
        }
        return isSuccess
    }
    public async insertDocument(document: any): Promise<boolean> {
        var isSuccess = false;
        var databse: Db = this.db
        try {
            var rslt: InsertOneWriteOpResult = await this.db.collection("mfgdata").insertOne(document)
            isSuccess = (rslt.result.n == 1)
        } catch (exp) {
            console.log(exp)
        }
        return isSuccess;
    }
    public async insertMultipleDocuments(documents: Object[]): Promise<boolean> {
        var isSuccess = false;
        var databse: Db = this.db
        try {
            var rslt: InsertWriteOpResult = await databse.collection("mfgdata").insertMany(documents)
            isSuccess = (rslt.result.n == documents.length)
        } catch (exp) {
            console.log(exp)
        }
        return isSuccess;
    }
    public async retriveDocuments(selector:any):Promise<Object[]>{
        var rsltSet = new Array();
        var databse: Db = this.db
        try {
            rsltSet =  await databse.collection("mfgdata").find(selector).toArray()
            
        } catch (exp) {
            console.log(exp)
        }
        return rsltSet;
    }
    public async modifyDocument(selector:any,document: any):Promise<boolean>{
        var result = false;
        var databse: Db = this.db
        try {
            var updResult:UpdateWriteOpResult=await  databse.collection("mfgdata").updateOne(selector,{"$set": document})
            result = (updResult.modifiedCount==1)
        } catch (exp) {
            console.log(exp)
        }
        return result;
    }
}
