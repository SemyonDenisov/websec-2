
const express = require('express'),
    app = express(),
    axios = require('axios');  
    
    var mysql = require('mysql2');  

    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "1717",
      });
app.listen(3000, () => {
    console.log('Server is running at http://localhost:3000');
    });
    
    const lessonTypes = {
        "1": "Лекция",
        "2": "Лабораторная",
        "3": "Практика",
        "4": "Другое",
        "5": "Экзамен/Консультация/Зачет",
        "6": "Курсовой проект"
    }

const reg_time_matr=[/(9:35)((.|\n)*)(?=(9:45))+/g,
    /(11:20)((.|\n)*)(?=(11:30))/g,
    /(13:05)((.|\n)*)(?=(13:30))/g,
    /(15:05)((.|\n)*)(?=(15:15))/g,
    /(16:50)((.|\n)*)(?=(17:00))/g,
    /(18:35)((.|\n)*)(?=(18:45))/g,
    /(20:15)((.|\n)*)(?=(20:25))/g
]

var faculties=[]
var linkGroupList=[]
var numGroupList=[]


app.get('/faculties', (req, res) => {
    const response = axios.get(`https://ssau.ru/rasp/`).then(function(res){
        faculties=res.data
        let r= /\/rasp\/faculty\/([0-9]){9}\?course=1/g
        faculties= faculties.match(r)
        faculties=faculties.map((el)=>'https://ssau.ru'+el)
        console.log(faculties)
    })
    res.send("aaaaaaaaaa")});
   

const transpose = matrix => matrix[0].map((col, i) => matrix.map(row => row[i]));

app.get('/groups', (req, res) => {
    var templinkGroupList=[]
    var tempnumGroupList =[]
    for (j=0;j<faculties.length;j++){
        for (i=1;i<6;i++){
        const response = axios.get(faculties[j]).then(function(res){
        text=res.data
        let r_1=  /\/rasp\?groupId=([0-9])(\d+)/g
        let r_2= /<span>([0-9]){4}-([0-9]){6}(.)<\/span>/g
        templinkGroupList= text.match(r_1)
        tempnumGroupList = text.match(r_2)
        if (templinkGroupList!=null){
            templinkGroupList=templinkGroupList.map((el)=>'https://ssau.ru'+el)
            linkGroupList=linkGroupList.concat(templinkGroupList)
            console.log(faculties[j])
        }
        if (tempnumGroupList!=null){
            tempnumGroupList=tempnumGroupList.map((el)=>el.substring(6, el.length-7))
            numGroupList=numGroupList.concat(tempnumGroupList)
            console.log(faculties[j])
        }
    })
        faculties[j] = faculties[j].substring(0, faculties[j].length-1) + `${i+1}`
    }
    }
    res.send(faculties)});


function getGroupSchedule(link, selectedWeek, selectedWeekday){
    let link_to_schedule=`${link}&selectedWeek=${selectedWeek}&selectedWeekday=${selectedWeekday}`
    axios.get(link_to_schedule).then(function(response){
    responseData = response.data
    const rawScheduleRegex = /class="schedule__time-item">((.|\n)*)class="footer"/g
    const rawSchedule = responseData.match(rawScheduleRegex)
    if (rawSchedule === null){
        isIntroduced = (/расписание пока не введено/i).test(responseData)
        if(isIntroduced){
            return "Расписание не введено"
        }
        else{
            return []
        }
    } 
    const rawTimeScheduleRegex = /(\d\d:\d\d)((.|\n)(?!(\d\d:\d\d)))*/g
    const rawTimeSchedule = rawSchedule[0].match(rawTimeScheduleRegex)
    rawSubjectsMatrix = []
    const rawAnotherSubjectMatrix = []
    timeMatrix = []
    for (rawScheduleListNumber = 1; rawScheduleListNumber < rawTimeSchedule.length; rawScheduleListNumber+=2){
        const subjectRegex = /<div(\n?)class="schedule__item((.|\n)(?!(<div(\n?)class="schedule__item)))*/g
        const anotherSubjectRegex = /schedule__item(.|\n)*?<\/div><\/div><\/div><div/g
        const timeRegex = /\d\d:\d\d/g
        startTime = rawTimeSchedule[rawScheduleListNumber-1].match(timeRegex)
        finishTime = rawTimeSchedule[rawScheduleListNumber].match(timeRegex)
        timeMatrix.push({startTime: startTime[0], finishTime: finishTime[0]})
        rawSubjectsMatrix.push(rawTimeSchedule[rawScheduleListNumber].match(subjectRegex))
        rawAnotherSubjectMatrix.push(rawTimeSchedule[rawScheduleListNumber].match(anotherSubjectRegex))
    }   
    subjectsMatrix = []
    typeSubjectMatrix = []
    groupsMatrix = []
    placeMatrix = []
    lectorMatrix = []
    groupSchedule = []
    for (rawSubjectListNumber=0; rawSubjectListNumber<rawSubjectsMatrix.length; rawSubjectListNumber++){
        subjectsMatrix.push([])
        typeSubjectMatrix.push([])
        groupsMatrix.push([])
        placeMatrix.push([])
        lectorMatrix.push([])
        for (rawSubjectIndex=0; rawSubjectIndex<rawSubjectsMatrix[rawSubjectListNumber].length; rawSubjectIndex++){
            const rawSubjectNameRegex = /lesson-color-type-\d(.)*</g
            const subjectRegex = / ((.)*)(?!<\/div>)/g
            rawSubject = rawSubjectsMatrix[rawSubjectListNumber][rawSubjectIndex].match(rawSubjectNameRegex)
            if(rawSubject !== null) {
                subjectsMatrix[rawSubjectListNumber].push([])
                for (subjectIndex = 0; subjectIndex < rawSubject.length; subjectIndex++){
                    subject = rawSubject[subjectIndex].match(subjectRegex)
                    subject = subject[0].replace(/<\/div></g,"").substring(1)
                    subjectsMatrix[rawSubjectListNumber][rawSubjectIndex].push(subject)
                }
            }
            else{
                subjectsMatrix[rawSubjectListNumber].push(null)
            }

            const rawTypeRegex = /lesson-color-type-\d/g
            const typeNumberRegex = /\d/g
            rawType = rawSubjectsMatrix[rawSubjectListNumber][rawSubjectIndex].match(rawTypeRegex)
            if(rawType !== null) {
                typeSubjectMatrix[rawSubjectListNumber].push([])
                for (typeIndex = 0; typeIndex < rawType.length; typeIndex++){
                    type = rawType[typeIndex].match(typeNumberRegex)
                    typeSubjectMatrix[rawSubjectListNumber][rawSubjectIndex].push(lessonTypes[type])
                }
            }
            else{
                typeSubjectMatrix[rawSubjectListNumber].push(null)
            }

            const rawGroupRegex = /href=\"\/rasp\?groupId=(.)*>/g
            const rawGroupNumberRegex = /schedule__group\">(.)* /g
            const rawGroupIdRegex = /\/rasp\?groupId=(\d)*/g
            const groupIdRegex = /(\d)+/g
            const groupNumberRegex = /(\d{4})-(\d{6})(\D?)/g
            rawGroup = rawSubjectsMatrix[rawSubjectListNumber][rawSubjectIndex].match(rawGroupRegex)
            if (rawGroup!== null){
                groupsMatrix[rawSubjectListNumber].push([])
                for (rawGroupIndex = 0; rawGroupIndex < rawGroup.length; rawGroupIndex++){
                    rawGroupNumber = rawGroup[rawGroupIndex].match(rawGroupNumberRegex)
                    rawGroupId =  rawGroup[rawGroupIndex].match(rawGroupIdRegex)
                    groupNumber = rawGroupNumber[0].match(groupNumberRegex)
                    groupId = rawGroupId[0].match(groupIdRegex)
                    groupsMatrix[rawSubjectListNumber][rawSubjectIndex].push([{"groupNumber":groupNumber[0]},{"groupId": groupId}])
                }
            }
            else{
                groupsMatrix[rawSubjectListNumber].push(null)
            }

            const rawSubjectPlaceRegex = /schedule__place\">(.)*<\/div>/g
            const subjectPlaceRegex = />(.)*</g
            rawSubjectPlace = rawSubjectsMatrix[rawSubjectListNumber][rawSubjectIndex].match(rawSubjectPlaceRegex)
            if (rawSubjectPlace!==null){
                placeMatrix[rawSubjectListNumber].push([])
                for (rawPlaceIndex = 0; rawPlaceIndex < rawSubjectPlace.length; rawPlaceIndex++){
                    subjectPlace = rawSubjectPlace[rawPlaceIndex].match(subjectPlaceRegex)
                    placeMatrix[rawSubjectListNumber][rawSubjectIndex].push(subjectPlace[0].substring(2).slice(0, -1))
                }
            }
            else{
                placeMatrix[rawSubjectListNumber].push(null)
            }
        }

        for(rawSubjectIndex=0; rawSubjectIndex<rawAnotherSubjectMatrix[rawSubjectListNumber].length; rawSubjectIndex++){
            const rawLectorNameRegex = /schedule__teacher(.|\n)*?<\/div>/g
            rawLectorName = rawAnotherSubjectMatrix[rawSubjectListNumber][rawSubjectIndex].match(rawLectorNameRegex)
            if (rawLectorName !== null){
                let subGroup = []
                const rawSubGroupRegex = /Подгруппы: \d/g
                const rawSubGroup = rawAnotherSubjectMatrix[rawSubjectListNumber][rawSubjectIndex].match(rawSubGroupRegex)
                if(rawSubGroup !== null){
                    const subGroupRegex = /\d/g
                    for (indexSub = 0; indexSub < rawSubGroup.length; indexSub++){
                        subGroup.push(rawSubGroup[indexSub].match(subGroupRegex)[0])
                    }
                }
                lectorMatrix[rawSubjectListNumber].push([])
                for (rawLectorIndex = 0; rawLectorIndex < rawLectorName.length; rawLectorIndex++){
                    const lectorNameRegex = />([А-ЯЁ]|[а-яё]|(\.)|( )|(-)){4,}</g
                    const lectorIdRegex = /(\d)+/g
                    const lectorName = rawLectorName[rawLectorIndex].match(lectorNameRegex)[0].substring(1).slice(0,-1) 
                    lectorId = rawLectorName[rawLectorIndex].match(lectorIdRegex)
                    if(lectorId === null){
                        lectorId = [-1]
                    }
                    if(subGroup.length === 0){
                        lectorMatrix[rawSubjectListNumber][rawSubjectIndex].push({lectorName: lectorName, lectorId: lectorId[0]})
                    }
                    else{
                        lectorMatrix[rawSubjectListNumber][rawSubjectIndex].push({lectorName: lectorName, lectorId: lectorId[0], subGroup: subGroup[rawLectorIndex]})
                    }
                }
            }
        }
    }
    subjectsMatrix.forEach((subjectList, subjectListIndex) =>{
        groupSchedule.push([])
        console.log(subjectList)
        subjectList.forEach((subject, subjectIndex) =>{
            console.log(subject)
            if(subject===null){
                console.log(subjectIndex)
                groupSchedule[subjectListIndex].push(null)
            }
            else{
                var element = new Object()
                    element.subject = JSON.stringify(subjectsMatrix[subjectListIndex][subjectIndex])
                    element.time = JSON.stringify(timeMatrix[subjectListIndex])
                    element.place = JSON.stringify(placeMatrix[subjectListIndex][subjectIndex])
                    element.lector = JSON.stringify(lectorMatrix[subjectListIndex][0])
                    lectorMatrix[subjectListIndex].shift()
                    element.groups = JSON.stringify(groupsMatrix[subjectListIndex][subjectIndex])
                    element.type = JSON.stringify(typeSubjectMatrix[subjectListIndex][subjectIndex])
                groupSchedule[subjectListIndex].push(element)
            }
        })
    })
    t = transpose(groupSchedule)
    return JSON.parse(JSON.stringify(t))
    })
}

    
app.get('/search/:number', async function(req, res){
    let groupNum=''
    for (i=0;i<numGroupList.length;i++){
        if (numGroupList[i].includes(req.params.number)){
            groupNum=numGroupList.indexOf(numGroupList[i])
        }   
    }
    link=linkGroupList[groupNum]
    r = getGroupSchedule(link,12,1)
    res.send(r)
    })


var stuff_name=[]
var stuff_id=[]
var lectors=[]

async function getLectorsfromPage(pageNum){
    let r= /href="https:\/\/ssau\.ru\/staff\/(\d+)-(.)*">\n.*\n/g
    let r_name=/(.)*([А-ЯЁ]|[а-яё]|(\.)|( )|(-)){4,}/g
    let r_stuffid= /(\d)+/g
    const response = await axios.get(`https://ssau.ru/staff?page=${pageNum}&letter=0`).then(function(res){
        text=res.data
        stuff= text.match(r)
        for (j=0;j<stuff.length;j++){
            temp_name=stuff[j].match(r_name)
            //stuff_name=stuff_name.concat(temp_name)
            temp_id=stuff[j].match(r_stuffid)
            //stuff_id=stuff_id.concat(temp_id)
            lectors.push([temp_name[0],Number(temp_id[0])])
        }
})
}

app.get('/staff', async function(req, res) {
    lectors=[]
    for (i=1;i<3;i++)
    {
        await getLectorsfromPage(i)
        console.log(i,"-я страница загружена")
    }
    res.send(lectors)
    console.log(lectors)
    insertLectorsintoDB()
})

function insertLectorsintoDB(){
    con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        con.query("DROP DATABASE if exists Schedule", function (err, result) {  
            if (err) throw err;  
            console.log("Database deleted");  
            });  
        con.query("CREATE DATABASE if not exists schedule", function (err, result) {  
            if (err) throw err;  
            console.log("Database created");  
            });  
        con.query("Use schedule", function (err, result) {  
            if (err) throw err;  
            console.log("Database created");  
            });  
        con.query("CREATE TABLE if not exists lectors( lector_id int primary key NOT NULL AUTO_INCREMENT,fullname varchar(255), id int )", function (err, result) {  
            if (err) throw err;  
            console.log("Database created");  
            });  
        var sql = "INSERT INTO schedule.lectors(fullname, id) VALUES ?";
        con.query(sql, [lectors], function (err, result) {
        if (err) throw err;
        console.log("Number of records inserted: " + result.affectedRows);
        });
  });

}


app.get("/createDatabase", (req, res) => {

    con.connect(function(err) {  
        if (err) throw err;  
        console.log("Connected!");  
        
    })
    res.send("Database created")
});

app.get('/lectors', async function(req, res){
    res.send(stuff_id)
    })