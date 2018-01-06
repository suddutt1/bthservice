# bthservice
Service for Hyperledger Network
#Available rest apis

## Mock aadhar data with a given aadhaar number
```sh
```
## Insert a medical record by HealthService Assistant
```sh
POST: http://35.185.70.142:4000/api/invoke
Request posted:
{
  "channel": "wbhealthchannel",
  "org": "wbhealthdept",
  "ccid": "hcdm",
  "fn": "saveMedicalRecord",
  "args": [
    "{\"demographicDetail\":{\"age\":68,\"alcohol\":\"Y\",\"block\":\"DHANIAKHALI\",\"bloodGroup\":\"B+\",\"createBy\":\"AUTOGEN\",\"createTs\":\"20180106144026\",\"district\":\"HOOGHLY\",\"gender\":\"M\",\"maritalStatus\":\"Married\",\"objType\":\"com.hc.patientinfo\",\"patientAadharNo\":\"6273-2261-0437\",\"patientFirstName\":\"Haran\",\"patientLastName\":\"Mondal\",\"patientPhoneNumber\":\"9004333912\",\"smoking\":\"Y\",\"subDivision\":\"DHANIAKHALI\"},\"medicalRecord\":{\"bodyTemp\":\"103\",\"chronicDisease\":[\"Cholera\",\"Cholera\",\"Heart attack\",\"Cholera\"],\"createTs\":\"20180106144026\",\"date\":\"20180106144026\",\"objType\":\"com.hc.mrec\",\"pastMajorDisease\":[\"Tuberculosis\"],\"patientAadharNo\":\"6273-2261-0437\",\"pulseRate\":\"85\",\"recordCreator\":\"HCA1\",\"recordId\":\"7073-1697\",\"status\":\"Open\",\"symptoms\":[\"Fever\"]}}"
  ],
  "invokerRole": "HCA"
}
Status : 200 OK , Response : {"Status":"Success","Message":"Chain code invoke completed successfully","Payload":{"isSuccess":true,"message":"SUCCESS","result":"SUCCESS"},"TimeStamp":"2018-01-06T09:10:37.271Z"}
```
### Retrival of record using patient aadhar number ( used to see the history)
```sh
POST: http://35.185.70.142:4000/api/query
Request posted:
{
  "channel": "wbhealthchannel",
  "org": "wbhealthdept",
  "ccid": "hcdm",
  "fn": "retrieveMedicalRecords",
  "args": [
    "{\"patientAadharNo\":\"6273-2261-0437\",\"type\":\"W_AADHAAR\"}"
  ],
  "invokerRole": "HCA"
}
Status : 200 OK , Response : {"Status":"Success","Message":"Chain code query completed successfully","Payload":["[{\"bodyTemp\":\"103\",\"chronicDisease\":[\"Cholera\",\"Cholera\",\"Heart attack\",\"Cholera\"],\"createTs\":\"20180106144026\",\"date\":\"20180106144026\",\"objType\":\"com.hc.mrec\",\"pastMajorDisease\":[\"Tuberculosis\"],\"patientAadharNo\":\"6273-2261-0437\",\"pulseRate\":\"85\",\"recordCreator\":\"HCA1\",\"recordId\":\"7073-1697\",\"status\":\"Open\",\"symptoms\":[\"Fever\"]}]"],"TimeStamp":"2018-01-06T09:10:53.001Z"}
```
### Queue for Health Service Assistant
```sh
POST: http://35.185.70.142:4000/api/query
Request posted:
{
  "channel": "wbhealthchannel",
  "org": "wbhealthdept",
  "ccid": "hcdm",
  "fn": "retrieveMedicalRecords",
  "args": [
    "{\"recordCreator\":\"HCA1\",\"type\":\"W_HCAID\"}"
  ],
  "invokerRole": "HCA"
}
Status : 200 OK , Response : {"Status":"Success","Message":"Chain code query completed successfully","Payload":["[{\"bodyTemp\":\"102\",\"chronicDisease\":[\"Heart attack\"],\"createTs\":\"20180106143044\",\"date\":\"20180106143044\",\"objType\":\"com.hc.mrec\",\"pastMajorDisease\":[\"Tuberculosis\",\"Heart attack\",\"Heart attack\"],\"patientAadharNo\":\"9557-0431-8822\",\"pulseRate\":\"90\",\"recordCreator\":\"HCA1\",\"recordId\":\"3667-4141\",\"status\":\"Open\",\"symptoms\":[\"Fever\",\"Cold\"]},{\"bodyTemp\":\"103\",\"chronicDisease\":[\"Cholera\",\"Cholera\",\"Heart attack\",\"Cholera\"],\"createTs\":\"20180106144026\",\"date\":\"20180106144026\",\"objType\":\"com.hc.mrec\",\"pastMajorDisease\":[\"Tuberculosis\"],\"patientAadharNo\":\"6273-2261-0437\",\"pulseRate\":\"85\",\"recordCreator\":\"HCA1\",\"recordId\":\"7073-1697\",\"status\":\"Open\",\"symptoms\":[\"Fever\"]},{\"bodyTemp\":\"104\",\"chronicDisease\":[\"Maleria\",\"Tuberculosis\",\"Tuberculosis\",\"Maleria\"],\"createTs\":\"20180106143409\",\"date\":\"20180106143409\",\"objType\":\"com.hc.mrec\",\"pastMajorDisease\":[\"Diabetes\"],\"patientAadharNo\":\"4513-3849-9206\",\"pulseRate\":\"80\",\"recordCreator\":\"HCA1\",\"recordId\":\"9589-1644\",\"status\":\"Open\",\"symptoms\":[\"Fever\",\"Fever\"]},{\"bodyTemp\":\"102\",\"chronicDisease\":[\"Cholera\",\"Diabetes\",\"Heart attack\"],\"createTs\":\"20180106143130\",\"date\":\"20180106143130\",\"objType\":\"com.hc.mrec\",\"pastMajorDisease\":[\"Diabetes\",\"Maleria\"],\"patientAadharNo\":\"4251-0718-1192\",\"pulseRate\":\"80\",\"recordCreator\":\"HCA1\",\"recordId\":\"9862-2628\",\"status\":\"Open\",\"symptoms\":[\"Diarrhoea\",\"Diarrhoea\"]}]"],"TimeStamp":"2018-01-06T09:10:54.029Z"}

```
### Queue for doctors home page for possible request those are unattended

```sh
POST: http://35.185.70.142:4000/api/query
Request posted:
{
  "channel": "wbhealthchannel",
  "org": "wbhealthdept",
  "ccid": "hcdm",
  "fn": "retrieveMedicalRecords",
  "args": [
    "{\"type\":\"W_NODOCTOR\"}"
  ],
  "invokerRole": "HCA"
}
Status : 200 OK , Response : {"Status":"Success","Message":"Chain code query completed successfully","Payload":["[{\"bodyTemp\":\"102\",\"chronicDisease\":[\"Heart attack\"],\"createTs\":\"20180106143044\",\"date\":\"20180106143044\",\"objType\":\"com.hc.mrec\",\"pastMajorDisease\":[\"Tuberculosis\",\"Heart attack\",\"Heart attack\"],\"patientAadharNo\":\"9557-0431-8822\",\"pulseRate\":\"90\",\"recordCreator\":\"HCA1\",\"recordId\":\"3667-4141\",\"status\":\"Open\",\"symptoms\":[\"Fever\",\"Cold\"]},{\"bodyTemp\":\"103\",\"chronicDisease\":[\"Cholera\",\"Cholera\",\"Heart attack\",\"Cholera\"],\"createTs\":\"20180106144026\",\"date\":\"20180106144026\",\"objType\":\"com.hc.mrec\",\"pastMajorDisease\":[\"Tuberculosis\"],\"patientAadharNo\":\"6273-2261-0437\",\"pulseRate\":\"85\",\"recordCreator\":\"HCA1\",\"recordId\":\"7073-1697\",\"status\":\"Open\",\"symptoms\":[\"Fever\"]},{\"bodyTemp\":\"104\",\"chronicDisease\":[\"Maleria\",\"Tuberculosis\",\"Tuberculosis\",\"Maleria\"],\"createTs\":\"20180106143409\",\"date\":\"20180106143409\",\"objType\":\"com.hc.mrec\",\"pastMajorDisease\":[\"Diabetes\"],\"patientAadharNo\":\"4513-3849-9206\",\"pulseRate\":\"80\",\"recordCreator\":\"HCA1\",\"recordId\":\"9589-1644\",\"status\":\"Open\",\"symptoms\":[\"Fever\",\"Fever\"]},{\"bodyTemp\":\"102\",\"chronicDisease\":[\"Cholera\",\"Diabetes\",\"Heart attack\"],\"createTs\":\"20180106143130\",\"date\":\"20180106143130\",\"objType\":\"com.hc.mrec\",\"pastMajorDisease\":[\"Diabetes\",\"Maleria\"],\"patientAadharNo\":\"4251-0718-1192\",\"pulseRate\":\"80\",\"recordCreator\":\"HCA1\",\"recordId\":\"9862-2628\",\"status\":\"Open\",\"symptoms\":[\"Diarrhoea\",\"Diarrhoea\"]}]"],"TimeStamp":"2018-01-06T09:10:54.909Z"}
```
