
const express = require('express'),
    app = express(),
    axios = require('axios');  

app.listen(3000, () => {
    console.log('Server is running at http://localhost:3000');
    });



var faculties=[]
var linkGroupList=[]
var numGroupList=[]

function rewind(lst){
    var rewind_list=[]
    for(i=0;i<lst.lenght;i++){
        for(j=0;j<lst[i].lenght;j++){
            rewind_list.push(lst[i][j])
            console.log(lst[i][j])
        }
    }
    console.log(rewind_list)
    return rewind_list
}

app.get('/faculties', (req, res) => {
    const response = axios.get(`https://ssau.ru/rasp/`).then(function(res){
        faculties=res.data
        let r= /\/rasp\/faculty\/([0-9]){9}\?course=1/g
        faculties= faculties.match(r)
        faculties=faculties.map((el)=>'https://ssau.ru'+el)
        console.log(faculties)
    })
    res.send("aaaaaaaaaa")});
   
app.get('/groups', (req, res) => {
    var templinkGroupList=[]
    var tempnumGroupList =[]
    for (j=0;j<faculties.length;j++){
        for (i=1;i<5;i++){
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
  
app.get('/list', (req, res) => {
    res.send(faculties)});
app.get('/links', (req, res) => {
    console.log(linkGroupList[0])
    res.send(linkGroupList)});
app.get('/numbers', (req, res) => {
    console.log(numGroupList[0])
    res.send(numGroupList)});

app.get('/search/:number', (req, res) => {
    link=linkGroupList[numGroupList.indexOf(req.params.number)]
    const response = axios.get(link).then(function(re){res.send(re.data)})
    });