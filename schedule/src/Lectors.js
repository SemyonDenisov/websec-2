import React from 'react';
import {useState } from 'react';
import { useEffect} from 'react';
import axios from 'axios';
import './style.css'


const currentWeek=()=>{
   return Math.floor((+new Date() - +new Date(2023, 7, 27)) / 1000 / 60 / 60 / 24 / 7)+1
}

var colorDict = {
    "Lab bg-gradient border border-dark":"Лабораторная",
    "Practice bg-gradient border border-dark":"Практика",
    "Lecture bg-gradient border border-dark":"Лекция",
    "Other bg-gradient border border-dark":"Другое",
    "Window bg-gradient border border-dark":"Окно"
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
         let color=getKeyByValue(colorDict,"Окно")
        return(
        <td class={color}>
        </td>
       
        
        )
    }
}



export class Lectors extends React.Component {

    constructor(props) {
        
      super(props);
      this.state = {
        head:'',
        lectors: [],
        schedule:'',
        week: currentWeek(),
        id:'',
        name:''
      };
    }

    listItems=()=>{
        <>
        {this.state.lectors.lenght>0?
        <>{this.state.lectors.map((lector) => 
            (<button type="button" class="list-group-item list-group-item-action active" 
            aria-current="true"onClick={() => {this.state.week=currentWeek();this.searchLector(lector.id,lector.name)}}>{lector.name}
        </button>))}
        </> :
        <></>}
        </>}
    
    updateWeek = async()=>{
      let cur=this.state.week
      cur+=1
      this.setState({week: this.state.week + 1})
    }

    updateLectors = async(request) => {
        let name= request
        if (name==''){
         name='1'
        }
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

    searchLector = async(request,lector) => {
        let week=this.state.week
        var text
        await axios.get(`http://localhost:3001/staff/${request}?week=${week}`).then(function(res){
            text=res.data
            
        })  
        .catch((error) => {
            console.error(error);});
        //this.setState({head:name})
        this.setState({lectors:{}})
        this.setState({schedule:text})
        this.setState({id:request})
        this.setState({name:lector})
    };

    prevWeek=()=>{
      if(this.state.week>2){
         this.setState({week: this.state.week - 1})
      }
      this.searchLector(this.state.id,this.state.name)
    }

    nextWeek=()=>{
      if(this.state.week<18){
         this.setState({week: this.state.week + 1})
      }
      
      this.searchLector(this.state.id,this.state.name)
    }

    

    // changeColor = () => {
    //   this.setState({color: "blue"});
    // }
    render() {
      return (
      <div class="container " >
        <div class="size Types">
            <div class="row Size Types">
            <input type="text" class="form-control Types" placeholder="Введите имя преподавателя" 
            aria-label="Example text with button addon" aria-describedby="button-addon1"
            onChange={(event) => this.updateLectors(event.target.value)}/>
            </div>
            {Array.isArray(this.state.lectors)?
            <>
            <div class="container overflow-auto size" >
               <div className="list-group" aria-current="true">
                     {this.state.lectors.map((lector) => 
                           (
                     <a class="list-group-item btn btn-info" data-toggle="collapse"   
                        onClick={() => {this.state.week=currentWeek();this.searchLector(lector.id,lector.name)}}>{lector.name}
                     </a>
                     ))}
               </div>
            </div>
            
            </> :
            <></>}
        </div>

        

         <div class="table">
        {!Array.isArray(this.state.schedule)?
        <>{
            <>
        </>
        }</> 
        :
        <>         
        <div class="container Types" >
            <ul class=" list-group list-group-horizontal">
               <li type="button" class="btn btn-info list-group-item Button" 
               onClick={()=>this.prevWeek()}>{this.state.week-1} неделя
               </li>
               <li class="list-group-item Info">
               <h2 >{this.state.name}</h2>
               <h2 >{this.state.week} Неделя</h2>
               </li>
               <li type="button" class="btn btn-info list-group-item Button" 
               onClick={()=>this.nextWeek()}>{this.state.week+1} неделя
            </li>
            </ul>
            <div class="container ">
            <div class="row Types ">
               <div class="col-sm Lab">
               Лабораторная
               </div>
               <div class="col-sm Lecture">
               Лекция
               </div>
               <div class="col-sm Practice">
               Практика
               </div>
               <div class="col-sm Other">
               Другое
               </div>
            </div>
            <table class="Types" data-toggle="table"  data-response-handler="responseHandler">
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
        {!(this.state.schedule.length==0)?<>
        {this.state.schedule.map((item) => 
            (<tr>
                {item.map((elem)=>{
                    return ( convertElem(elem))}
                )}
            </tr>)
        )}
         </>:
         <>
         <h2>Расписание не введено</h2>
         </>
         }
        </table>
        </div>
        </div>
        </>
        }
         </div>
        </div>)
    }
  }

