import { response } from 'express'

export function insertGroupsintoDB(connection,groups){
    connection.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        connection.query("Use schedule", function (err, result) {  
            if (err) throw err;  
            console.log("Use schedule");  
            });  
            connection.query("CREATE TABLE if not exists `groups` ( group_id int primary key NOT NULL AUTO_INCREMENT,group_number varchar(255), id int )", function (err, result) {  
            if (err) throw err;  
            console.log("Table groups created");  
            });  
        var sql = "INSERT INTO `groups`(group_number, id) VALUES ?";
        connection.query(sql, [groups], function (err, result) {
        if (err) throw err;
        console.log("Number of records inserted: " + result.affectedRows);
        });
    });
    }

export async function getLectorFromDBById(connection,id){
    var lector
    await connection.promise().query("select fullname, id from lectors where id== ?",id)
    .then(result => {  
        let response=result[0]
        
            lector = response[0].id
            console.log("Success (get lectors by name)");
        })
        .catch(err =>{
            console.log(err);
            });
        
    return lector
}

export async function getStufffromDB(connection){
    var lectors=[]
    await connection.promise().query("select fullname, id from lectors")
    .then(result => {  
        let response=result[0]
        for(let i=0; i < response.length; i++){
        lectors.push([response[i].fullname,response[i].id])
            }  
            console.log("Succes (get lectors)");
            //console.log();
        })
        .catch(err =>{  
            console.log(err);
            });
        
    return JSON.stringify(lectors)
}

export async function getGroupsfromDB(connection){
    var groups=[]
    await connection.promise().query("select group_number, id from `groups`")
    .then(result => {  
        let response=result[0]
        for(let i=0; i < response.length; i++){
            groups.push([response[i].group_number,response[i].id])
            }  
            console.log("Succes (get groups)");
            //console.log();
        })
        .catch(err =>{
            console.log(err);
            });
        
    return groups
}


export async function getLectorIdByName(connection,fullname){
    var lector
    await connection.promise().query("select id from lectors where fullname = ?",fullname)
    .then(result => {
        if ( result.lenght!=0) {// сюдддддддддддддддддааааааааааааа смотри
        let response=result
        lector = response[0][0].id
        console.log(response);
        }
        else {
            console.log(response);

            return 0
        }
        })
        .catch(err =>{
            console.log(err);
          });
        
    return lector
}

export async function getGroupIdByNumber(connection,group_number){
    var group
    group_number=group_number+'%'
    await connection.promise().query("select id from `groups` where group_number like ? limit 1",group_number)
    .then(result => {  
        let response=result[0]
        group = response[0].id
        console.log(group);
        })
        .catch(err =>{
            console.log(err);
          });
    return group
}


export function createDB(connection){
    connection.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        connection.query("DROP DATABASE if exists schedule", function (err, result) {  
            if (err) throw err;  
            console.log("Database deleted");  
            });  
            connection.query("CREATE DATABASE if not exists schedule", function (err, result) {  
            if (err) throw err;  
            console.log("Database created");  
            }); 
    });
}

export function insertLectorsintoDB(connection,lectors){
    connection.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        connection.query("Use schedule", function (err, result) {  
            if (err) throw err;  
            console.log("Use schedule");  
            });  
            connection.query("CREATE TABLE if not exists `lectors` ( lector_id int primary key NOT NULL AUTO_INCREMENT,fullname varchar(255), id int )", function (err, result) {  
            if (err) throw err;  
            console.log("Table lectors created");  
            });  
        var sql = "INSERT INTO `lectors` (fullname, id) VALUES ?";
        connection.query(sql, [lectors], function (err, result) {
        if (err) throw err;
        console.log("Number of records inserted: " + result.affectedRows);
        });
    });
    }

export async function getLectorsNameStartWith(connection,firtsverbs){
    var lectors=[]
    var param=firtsverbs+'%'
    await connection.promise().query("select fullname, id from lectors where fullname like ?",param)
    .then(result => {  
        let response=result[0]
        for(let i=0; i < response.length; i++){
            lectors.push({id:response[i].id,name:response[i].fullname})
            }  
            console.log("Success (get lectors by first verbs of name)");
        })
        .catch(err =>{
            console.log(err);
            });
        
    return lectors
}
    