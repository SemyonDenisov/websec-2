import React from 'react';
import {useState } from 'react';
import { useEffect} from 'react';
import axios from 'axios';

var colorDict = {
    "bg-danger bg-gradient border border-dark":"Лабораторная",
    "bg-warning bg-gradient border border-dark":"Практика",
    "bg-primary bg-gradient border border-dark":"Лекция",
    "bg-success bg-gradient border border-dark":"Другое"
  };

function getKeyByValue(object, value) {
return Object.keys(object).find(key => object[key] === value);
}

function getGroupSchedule(){}

function convertElem(elem){
    if (elem){
        let color=getKeyByValue(colorDict,elem["type"])
        return (
            <td class={color}>
                <p>{elem["subject"]}</p>
                <p>{elem["time"]["startTime"]}-{elem["time"]["finishTime"]}</p>
                <p>{elem["place"]}</p>
                {elem["groups"].map((group)=>
                    <p type="button" onClick={() => getGroupSchedule()}>{group["groupNumber"]}
                    </p>
                )
                    
                }
                
            </td>
        )
    }
    else{
        return(
        <td class="border border-dark bg-info bg-gradient">
        </td>
       
        
        )
    }
}



export class Lectors extends React.Component {

    constructor(props) {
        
      super(props);
      this.state = {
        lectors: [],
        schedule:[]
      };
    }

    listItems=()=>{
        <>
        {this.state.lectors.lenght>0?
        <>{this.state.lectors.map((lector) => 
            (<button type="button" class="list-group-item list-group-item-action active" 
            aria-current="true"onClick={() => this.searchLector(lector.name)}>{lector.name}
        </button>))}
        </> :
        <></>}
        </>}
    


    updateLectors = async(request) => {
        let name= request
        var text
        await axios.get(`http://localhost:3001/staff/search/${name}`).then(function(res){
            text=res.data
        })  
        .catch((error) => { 
            console.error(error);});
        if (text.lenght!=0){  
            this.setState({lectors:text})
        }
        else {
            this.setState({lectors:{}})
        }
    }

    searchLector = async(request) => {
        var text
        var num=request
        await axios.get(`http://localhost:3001/staff/${request}`).then(function(res){
            text=res.data
        })  
        .catch((error) => {
            console.error(error);});
        this.flag=false
        this.setState({lectors:{}})
        this.setState({schedule:text})



    };


    

    // changeColor = () => {
    //   this.setState({color: "blue"});
    // }
    render() {
      return (<>
        <div class="input-group mb-3">
            <input type="text" class="form-control" placeholder="Введите имя преподавателя" 
            aria-label="Example text with button addon" aria-describedby="button-addon1"
            onChange={(event) => this.updateLectors(event.target.value)}/>
        </div>
            <ul>
        {Array.isArray(this.state.lectors)?
        <>
        <body data-bs-spy="scroll" data-bs-target="#navbar-example">
        {this.state.lectors.map((lector) => 
            (<button type="button" class="list-group-item list-group-item-action active" 
            aria-current="true"onClick={() => this.searchLector(lector.name)}>{lector.name}
        </button>))}
        </body>
        </> :
        <></>}
            </ul>

        <div>
        {Array.isArray(this.state.schedule)?
        <>{
            
            <table data-toggle="table" data-height="299"  data-response-handler="responseHandler">
        <thead>
        <tr class="bg-success bg-gradient border border-dark">
            <th class="border border-dark" data-field="пн">Понедельник</th>
            <th class="border border-dark" data-field="вт">Вторник</th>
            <th class="border border-dark" data-field="ср">Среда</th>
            <th class="border border-dark" data-field="чт">Четверг</th>
            <th class="border border-dark" data-field="пт">Пятница</th>
            <th class="border border-dark" data-field="сб">Суббота</th>
        </tr>
        </thead>

        {this.state.schedule.map((item) => 
            (<tr>
                {item.map((elem)=>{
                    return ( convertElem(elem))}
                )}
            </tr>)
        )}
        </table>
        
        }
        </> :
        <h1>Расписание пока не введено</h1>}
        </div>  
        </>)
    }
  }

