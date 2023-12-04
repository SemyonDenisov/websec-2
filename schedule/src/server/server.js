import * as DB from '../DB/functional.js';
import express from 'express';
import cors from 'cors'
import axios from 'axios';
import mysql from 'mysql2';

const currentWeek=()=>{
    return Math.floor((+new Date() - +new Date(2023, 7, 27)) / 1000 / 60 / 60 / 24 / 7)+1
 }

const app = express()
app.use(cors());
var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1717",
    });


app.listen(3001, async function(){
    let lectors=await getLectors()
    let groups=await getGroups()
    console.log(groups)
    DB.createDB(connection)
    DB.insertLectorsintoDB(connection,lectors)
    DB.insertGroupsintoDB(connection,groups)
    console.log('Server is running at http://localhost:3001');
    });
    
    const lessonTypes = {
        "1": "Лекция",
        "2": "Лабораторная",
        "3": "Практика",
        "4": "Другое",
        "5": "Экзамен/Консультация/Зачет",
        "6": "Курсовой проект"
    }

//var faculties=[]


async function getFaculties(){
    let faculties=[]
    await axios.get(`https://ssau.ru/rasp/`).then(function(res){
        faculties=res.data
        let r= /\/rasp\/faculty\/([0-9]){9}\?course=1/g
        faculties= faculties.match(r)
        faculties=faculties.map((el)=>'https://ssau.ru'+el)
        //console.log(faculties)
    }).catch((error) => {
        console.error(error);});
    return faculties
}

async function getGroupsbyFaculties(faculties){
    console.log(faculties)
    var linkGroupList=[]
    var numGroupList=[]
    var groups=[]
    var templinkGroupList=[]
    var tempnumGroupList =[]
    var r_groupid=/(\d)+/g
    var r_1=  /\/rasp\?groupId=([0-9])(\d+)/g
    var r_2= /<span>([0-9]){4}-([0-9]){6}(.)<\/span>/g
    for (let j=0;j<15;j++){ //111111111111111111111111111111111 faculties.length
        for (let i=1;i<6;i++){
        await axios.get(faculties[j])
        .then(function(res){
        let text=res.data
        templinkGroupList= text.match(r_1)
        tempnumGroupList = text.match(r_2)
        
        if (templinkGroupList!=null  && tempnumGroupList!=null){
            
                templinkGroupList=templinkGroupList.map((el)=>el.match(r_groupid)[0])
                linkGroupList=linkGroupList.concat(templinkGroupList)
                tempnumGroupList=tempnumGroupList.map((el)=>el.substring(6, el.length-7))
                numGroupList=numGroupList.concat(tempnumGroupList)
            for (let k=0;k<templinkGroupList.length;k++){
                groups.push([tempnumGroupList[k],templinkGroupList[k]])
            }
            //console.log(faculties[j])
        }})
        .catch((error) => {
            console.error(error);});
        
        faculties[j] = faculties[j].substring(0, faculties[j].length-1) + `${i+1}`
    }
    }
    console.log(groups)
    return groups
}

async function getGroups(){
    let faculties = await getFaculties()
    let groups = await getGroupsbyFaculties(faculties)
    return groups
}


export async function getGroupSchedule(link, selectedWeek, selectedWeekday){
    var t
    var subjectsMatrix = []
    let link_to_schedule=`https://ssau.ru/rasp?groupId=${link}&selectedWeek=${selectedWeek}&selectedWeekday=${selectedWeekday}`
    await axios.get(link_to_schedule).then(function(response){
    let responseData = response.data
    const rawScheduleRegex = /class="schedule__time-item">((.|\n)*)class="footer"/g
    const rawSchedule = responseData.match(rawScheduleRegex)
    if (rawSchedule === null){
        let isIntroduced = (/асписание пока не введено/g).test(responseData)
        if(isIntroduced){
            return "Расписание не введено"
        }
        else{
            return []
        }
    } 
    const rawTimeScheduleRegex = /(\d\d:\d\d)((.|\n)(?!(\d\d:\d\d)))*/g
    const rawTimeSchedule = rawSchedule[0].match(rawTimeScheduleRegex)
    let rawSubjectsMatrix = []
    const rawAnotherSubjectMatrix = []
    let timeMatrix = []
    for (let rawScheduleListNumber = 1; rawScheduleListNumber < rawTimeSchedule.length; rawScheduleListNumber+=2){
        const subjectRegex = /<div(\n?)class="schedule__item((.|\n)(?!(<div(\n?)class="schedule__item)))*/g
        const anotherSubjectRegex = /schedule__item(.|\n)*?<\/div><\/div><\/div><div/g
        const timeRegex = /\d\d:\d\d/g
        let startTime = rawTimeSchedule[rawScheduleListNumber-1].match(timeRegex)
        let finishTime = rawTimeSchedule[rawScheduleListNumber].match(timeRegex)
        timeMatrix.push({startTime: startTime[0], finishTime: finishTime[0]})
        rawSubjectsMatrix.push(rawTimeSchedule[rawScheduleListNumber].match(subjectRegex))
        rawAnotherSubjectMatrix.push(rawTimeSchedule[rawScheduleListNumber].match(anotherSubjectRegex))
    }   
    let typeSubjectMatrix = []
    let groupsMatrix = []
    let placeMatrix = []
    let lectorMatrix = []
    let groupSchedule = []
    for (let rawSubjectListNumber=0; rawSubjectListNumber<rawSubjectsMatrix.length; rawSubjectListNumber++){
        subjectsMatrix.push([])
        typeSubjectMatrix.push([])
        groupsMatrix.push([])
        placeMatrix.push([])
        lectorMatrix.push([])
        if (rawSubjectsMatrix[rawSubjectListNumber]!=null){
        for (let rawSubjectIndex=0; rawSubjectIndex<rawSubjectsMatrix[rawSubjectListNumber].length; rawSubjectIndex++){
            const rawSubjectNameRegex = /lesson-color-type-\d(.)*</g
            const subjectRegex = / ((.)*)(?!<\/div>)/g
            let rawSubject = rawSubjectsMatrix[rawSubjectListNumber][rawSubjectIndex].match(rawSubjectNameRegex)
            if(rawSubject !== null) {
                subjectsMatrix[rawSubjectListNumber].push([])
                for (let subjectIndex = 0; subjectIndex < rawSubject.length; subjectIndex++){
                    let subject = rawSubject[subjectIndex].match(subjectRegex)
                    subject = subject[0].replace(/<\/div></g,"").substring(1)
                    subjectsMatrix[rawSubjectListNumber][rawSubjectIndex].push(subject)
                }
            }
            else{
                subjectsMatrix[rawSubjectListNumber].push(null)
            }
            const rawTypeRegex = /lesson-color-type-\d/g
            const typeNumberRegex = /\d/g
            let rawType = rawSubjectsMatrix[rawSubjectListNumber][rawSubjectIndex].match(rawTypeRegex)
            if(rawType !== null) {
                typeSubjectMatrix[rawSubjectListNumber].push([])
                for (let typeIndex = 0; typeIndex < rawType.length; typeIndex++){
                    let type = rawType[typeIndex].match(typeNumberRegex)
                    typeSubjectMatrix[rawSubjectListNumber][rawSubjectIndex].push(lessonTypes[type])
                }
            }
            else{
                typeSubjectMatrix[rawSubjectListNumber].push(null)
            }

            const rawGroupRegex = /href="\/rasp\?groupId=(.)*>/g
            const rawGroupNumberRegex = /schedule__group">(.)* /g
            const rawGroupIdRegex = /\/rasp\?groupId=(\d)*/g
            const groupIdRegex = /(\d)+/g
            const groupNumberRegex = /(\d{4})-(\d{6})(\D?)/g
            let rawGroup = rawSubjectsMatrix[rawSubjectListNumber][rawSubjectIndex].match(rawGroupRegex)
            if (rawGroup!== null){
                groupsMatrix[rawSubjectListNumber].push([])
                for (let rawGroupIndex = 0; rawGroupIndex < rawGroup.length; rawGroupIndex++){
                    let rawGroupNumber = rawGroup[rawGroupIndex].match(rawGroupNumberRegex)
                    let rawGroupId =  rawGroup[rawGroupIndex].match(rawGroupIdRegex)
                    let groupNumber = rawGroupNumber[0].match(groupNumberRegex)
                    let groupId = rawGroupId[0].match(groupIdRegex)
                    groupsMatrix[rawSubjectListNumber][rawSubjectIndex].push([{"groupNumber":groupNumber[0]},{"groupId": groupId}])
                }
            }
            else{
                groupsMatrix[rawSubjectListNumber].push(null)
            }

            const rawSubjectPlaceRegex = /schedule__place">(.)*<\/div>/g
            const subjectPlaceRegex = />(.)*</g
            let rawSubjectPlace = rawSubjectsMatrix[rawSubjectListNumber][rawSubjectIndex].match(rawSubjectPlaceRegex)
            if (rawSubjectPlace!==null){
                placeMatrix[rawSubjectListNumber].push([])
                for (let rawPlaceIndex = 0; rawPlaceIndex < rawSubjectPlace.length; rawPlaceIndex++){
                    let subjectPlace = rawSubjectPlace[rawPlaceIndex].match(subjectPlaceRegex)
                    placeMatrix[rawSubjectListNumber][rawSubjectIndex].push(subjectPlace[0].substring(2).slice(0, -1))
                }
            }
            else{
                placeMatrix[rawSubjectListNumber].push(null)
            }
        }
    }
        if (rawAnotherSubjectMatrix[rawSubjectListNumber]!=null){
        for(let rawSubjectIndex=0; rawSubjectIndex<rawAnotherSubjectMatrix[rawSubjectListNumber].length; rawSubjectIndex++){
            const rawLectorNameRegex = /schedule__teacher(.|\n)*?<\/div>/g
            let rawLectorName = rawAnotherSubjectMatrix[rawSubjectListNumber][rawSubjectIndex].match(rawLectorNameRegex)
            if (rawLectorName !== null){
                let subGroup = []
                const rawSubGroupRegex = /Подгруппы: \d/g
                const rawSubGroup = rawAnotherSubjectMatrix[rawSubjectListNumber][rawSubjectIndex].match(rawSubGroupRegex)
                if(rawSubGroup !== null){
                    const subGroupRegex = /\d/g
                    for (let indexSub = 0; indexSub < rawSubGroup.length; indexSub++){
                        subGroup.push(rawSubGroup[indexSub].match(subGroupRegex)[0])
                    }
                }
                lectorMatrix[rawSubjectListNumber].push([])
                for (let rawLectorIndex = 0; rawLectorIndex < rawLectorName.length; rawLectorIndex++){
                    const lectorNameRegex = />([А-ЯЁ]|[а-яё]|(\.)|( )|(-)){4,}</g
                    const lectorIdRegex = /(\d)+/g
                    const lectorName = rawLectorName[rawLectorIndex].match(lectorNameRegex)[0].substring(1).slice(0,-1) 
                    let lectorId = rawLectorName[rawLectorIndex].match(lectorIdRegex)
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
                    element.subject = subjectsMatrix[subjectListIndex][subjectIndex]
                    element.time = timeMatrix[subjectListIndex]
                    element.place = placeMatrix[subjectListIndex][subjectIndex]
                    element.lector = lectorMatrix[subjectListIndex][0]
                    lectorMatrix[subjectListIndex].shift()
                    element.groups = groupsMatrix[subjectListIndex][subjectIndex]
                    element.type = typeSubjectMatrix[subjectListIndex][subjectIndex]
                groupSchedule[subjectListIndex].push(element)
            }
        })
    })
    t = groupSchedule
    })
    if (t){
    return JSON.parse(JSON.stringify(t))
    }
    else {
        t=''
        return t
    }
}

export async function getLectorSchedule(staffId, selectedWeek, selectedWeekday){
    var t
    var subjectsMatrix = []
    await axios.get(`https://ssau.ru/rasp?staffId=${staffId}&selectedWeek=${selectedWeek}&selectedWeekday=${selectedWeekday}`)
    .then(function(res){
    let responseData=res.data
    const rawScheduleRegex = /class="schedule__time-item">((.|\n)*)class="footer"/g
    const rawSchedule = responseData.match(rawScheduleRegex)
    if (rawSchedule === null){
        let isIntroduced = (/асписание пока не введено/i).test(responseData)
        if(isIntroduced){
            return "Расписание не введено"
        }
        else{
            return []
        }
    } 
    const rawTimeScheduleRegex = /(\d\d:\d\d)((.|\n)(?!(\d\d:\d\d)))*/g
    const rawTimeSchedule = rawSchedule[0].match(rawTimeScheduleRegex)
    let rawSubjectsMatrix = []
    let timeMatrix = []
    let lectorSchedule = []
    for (let rawScheduleListNumber = 1; rawScheduleListNumber < rawTimeSchedule.length; rawScheduleListNumber+=2){
        const subjectRegex = /<div(\n?)class="schedule__item((.|\n)(?!(<div(\n?)class="schedule__item)))*/g
        const timeRegex = /\d\d:\d\d/g
        let startTime = rawTimeSchedule[rawScheduleListNumber-1].match(timeRegex)
        let finishTime = rawTimeSchedule[rawScheduleListNumber].match(timeRegex)
        timeMatrix.push([startTime[0], finishTime[0]])
        rawSubjectsMatrix.push(rawTimeSchedule[rawScheduleListNumber].match(subjectRegex))
    }   
    let typeSubjectMatrix = []
    let groupsMatrix = []
    let placeMatrix = []
    for (let rawSubjectListNumber=0; rawSubjectListNumber<rawSubjectsMatrix.length; rawSubjectListNumber++){
        subjectsMatrix.push([])
        typeSubjectMatrix.push([])
        groupsMatrix.push([])
        placeMatrix.push([])
        for (let rawSubjectIndex=0; rawSubjectIndex<rawSubjectsMatrix[rawSubjectListNumber].length; rawSubjectIndex++){
            const rawSubjectNameRegex = /lesson-color-type-\d(.)*</g
            const subjectRegex = / ((.)*)(?!<\/div>)/g
            let rawSubject = rawSubjectsMatrix[rawSubjectListNumber][rawSubjectIndex].match(rawSubjectNameRegex)
            if(rawSubject !== null) {
                let subject = rawSubject[0].match(subjectRegex)
                subject = subject[0].replace(/<\/div></g,"").substring(1)
                subjectsMatrix[rawSubjectListNumber].push(subject)
            }
            else{
                subjectsMatrix[rawSubjectListNumber].push(null)
            }

            const rawTypeRegex = /lesson-color-type-\d/g
            const typeNumberRegex = /\d/g
            let rawType = rawSubjectsMatrix[rawSubjectListNumber][rawSubjectIndex].match(rawTypeRegex)
            if(rawType !== null) {
                let type = rawType[0].match(typeNumberRegex)
                typeSubjectMatrix[rawSubjectListNumber].push(lessonTypes[type])
            }
            else{
                typeSubjectMatrix[rawSubjectListNumber].push(null)
            }
            const rawGroupRegex = /href="\/rasp\?groupId=(.)*<\/a>/g
            const rawGroupNumberRegex = /schedule__group">(.)*</g
            const rawGroupIdRegex = /\/rasp\?groupId=(\d)*/g
            const groupIdRegex = /(\d)+/g
            const groupNumberRegex = /(\d{4})-(\d{6})(\D)?( \(\d\))?/g
            let rawGroup = rawSubjectsMatrix[rawSubjectListNumber][rawSubjectIndex].match(rawGroupRegex)
            console.log(rawGroup)
            if (rawGroup!== null){
                groupsMatrix[rawSubjectListNumber].push([])
                for (let rawGroupIndex = 0; rawGroupIndex < rawGroup.length; rawGroupIndex++){
                    let rawGroupNumber = rawGroup[rawGroupIndex].match(rawGroupNumberRegex)
                    let rawGroupId = rawGroup[rawGroupIndex].match(rawGroupIdRegex)
                    console.log(rawGroupNumber[0])
                    let groupNumber = rawGroupNumber[0].match(groupNumberRegex)
                    let groupId = rawGroupId[0].match(groupIdRegex)
                    var group = new Object()
                        group.groupNumber = groupNumber[0]
                        group.groupId = groupId[0]
                    groupsMatrix[rawSubjectListNumber][rawSubjectIndex].push(group)
                }
            }
            else{
                groupsMatrix[rawSubjectListNumber].push(null)
            }

            const rawSubjectPlaceRegex = /schedule__place">(.)*<\/div>/g
            const subjectPlaceRegex = />(.)*</g
            let rawSubjectPlace = rawSubjectsMatrix[rawSubjectListNumber][rawSubjectIndex].match(rawSubjectPlaceRegex)
            if (rawSubjectPlace!==null){
                let subjectPlace = rawSubjectPlace[0].match(subjectPlaceRegex)
                placeMatrix[rawSubjectListNumber].push(subjectPlace[0].substring(2).slice(0, -1))
            }
            else{
                placeMatrix[rawSubjectListNumber].push(null)
            }
        }
    }
    subjectsMatrix.forEach((subjectList, subjectListIndex) =>{
        lectorSchedule.push([])
        subjectList.forEach((subject, subjectIndex) =>{
            if(subject===null){
                lectorSchedule[subjectListIndex].push(null)
            }
            else{
                var element = new Object()
                    element.subject = subjectsMatrix[subjectListIndex][subjectIndex]
                    var time = new Object()
                        time.startTime = timeMatrix[subjectListIndex][0]
                        time.finishTime = timeMatrix[subjectListIndex][1]
                    element.time = time
                    element.place = placeMatrix[subjectListIndex][subjectIndex]
                    element.groups = groupsMatrix[subjectListIndex][subjectIndex]
                    element.type = typeSubjectMatrix[subjectListIndex][subjectIndex]
                lectorSchedule[subjectListIndex].push(element)
            }
        })
    })
    t = lectorSchedule
    })
    if (t){
        return JSON.parse(JSON.stringify(t))
        }
        else {
            t=''
            return t
        }
}
    



async function getLectors(){
    var lectors=[]
    let r= /href="https:\/\/ssau\.ru\/staff\/(\d+)-(.)*">\n.*\n/g
    let r_name=/(.)*([А-ЯЁ]|[а-яё]|(\.)|( )|(-)){4,}/g
    let r_stuffid= /(\d)+/g
    for (let i=1;i<122;i++)//122
    {
        await axios.get(`https://ssau.ru/staff?page=${i}&letter=0`).then(function(res){
            let text=res.data
            let stuff= text.match(r)
            for (let j=0;j<stuff.length;j++){
                let temp_name=stuff[j].match(r_name)
                let temp_id=stuff[j].match(r_stuffid)
                lectors.push([temp_name[0],Number(temp_id[0])])
            }
            
        }).catch((error) => {
            console.error(error);});
        console.log(i,"-я страница загружена")
    }
    return lectors
}


app.get('/staff', async function(req, res) {
    var lectors= await DB.getStufffromDB(connection)
    //console.log(lectors);
    res.send(lectors)
})

app.get('/groups', async function(req, res) {
    var groups= await DB.getGroupsfromDB(connection)
    //console.log(lectors);
    res.send(groups)
})


app.get('/groups/search/:firstletters', async function(req, res) {
    var groups =[]
    groups = await DB.getGroupsStartWith(connection,req.params.firstletters)
    res.send(groups)
    return groups
})



app.get('/staff/:id', async function(req, res) {
    //var lector= await DB.getLectorIdByName(connection,req.params.name)
    let id=req.params.id
    let week=currentWeek()
    for (const key in req.query) {
        if (key === "week"){
            if(!isNaN(req.query[key])){
                week = req.query[key]
            }
        }
    }
    var text = await getLectorSchedule(id,week,1)
    if (text!=''){
    res.send(text)  
    }
    else{
        res.send([])
    }

    //var text = await getLectorSchedule('64778001',12,1)
    
    console.log(req.params.name);
    
})

app.get('/groups/:id', async function(req, res) {
    //var group= await DB.getGroupIdByNumber(connection,req.params.number)
    //console.log(group)
    let id=req.params.id
    let week=currentWeek()
    for (const key in req.query) {
        if (key === "week"){
            if(!isNaN(req.query[key])){
                week = req.query[key]
            }
        }
    }
    var text = await getGroupSchedule(id,week,1)
    console.log(req.params.id)
    if (text!=''){
        res.send(text)
    }
    else {
        res.send([])
    }
    //var text = await getLectorSchedule('64778001',12,1)
    
    //console.log(lectors);
})


app.get('/staff/search/:firstletters', async function(req, res) {
    var lectors= await DB.getLectorsNameStartWith(connection,req.params.firstletters)
    console.log("get lectorswith a specific first letters");
    res.send(lectors)
    return lectors
})

// app.get('/staff?id=', async function(req, res) {
//     console.log(lectors)
//     res.send(lectors)
// })
