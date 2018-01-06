# bthservice
Service for Hyperledger Network
#Available rest apis

## Mock aadhar data with a given aadhaar number
```sh
GET http://35.185.70.142:4000/aadhaar/aadhaarinfo/7058-8893-0527

Response: 
{"Status":"Success","Message":"User autheticated successfully","Payload":{"age":73,"alcohol":"N","block":"BUNDWAN","bloodGroup":"B+","createBy":"AUTOGEN","createTs":"2763-936","district":"PURULIA","gender":"M","maritalStatus":"Single","objType":"com.hc.patientinfo","patientAadharNo":"7058-8893-0527","patientFirstName":"Phatik","patientLastName":"Samonto","patientPhoneNumber":"9073662348","smoking":"N","subDivision":"BUNDWAN"},"TimeStamp":"2018-01-06T09:18:43.369Z"}

```
#### List valid aadhaar numbers 
"5533-7072-0206" "5407-4059-1548" "3768-4008-2671" "3612-2350-2126" "7149-7386-0221" "7845-0548-7694" "0178-2247-5028" "4998-8878-1082" "1926-1558-1668" "5535-6297-8989" "4812-8077-0692" "1002-6718-7657" "3281-7213-6676" "4388-1392-1637" "4392-2534-4598" "0290-6406-0256" "6495-7262-0991" "0331-6444-7148" "5214-5734-8631" "4519-9002-9046" "6248-6654-0062" "4923-1192-3368" "1218-7687-0674" "3194-3055-9871" "4247-6917-1125" "8765-2696-7940" "7027-3805-4109" "4056-2833-4007" "8386-0551-2614" "0758-9839-3064" "7058-8893-0527"

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

### Modify an existing record

```sh
POST: http://localhost:4000/api/invoke
Request posted:
{
  "channel": "wbhealthchannel",
  "org": "wbhealthdept",
  "ccid": "hcdm",
  "fn": "modifyMedicalRecord",
  "args": [
    "{\"diseaseDiagnosed\":[\"Tuberculosis\",\"Diabetes\",\"Tuberculosis\",\"Cholera\"],\"doctorResponded\":\"DOCTOR1\",\"medicine\":[\"Fluticason\",\"Amoxiciline\",\"Fluticason\"],\"objType\":\"com.hc.mrec\",\"recordId\":\"4682-2959\",\"responseTs\":\"20180106164638\",\"status\":\"Responded\"}"
  ],
  "invokerRole": "DOCTOR"
}
Status : 200 OK , Response : {"Status":"Success","Message":"Chain code invoke completed successfully","Payload":{"isSuccess":true,"message":"SUCCESS","result":"SUCCESS"},"TimeStamp":"2018-01-06T11:16:38.804Z"}

```