import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import * as moment from "moment";


@Injectable()
export class MongoService {

  constructor(private http:HttpClient) { }

  saveData(table:string, payload:any): Promise<any> {
    let url = 'http://localhost:8080/mongodb';
    console.log(url);
    return this.http.post(url, {table, payload}).toPromise();
  }



  geteData(table:string, find:any, fields:any, limit:number): Promise<any> {

    let url = 'http://localhost:8080/mongodb?table='+ table +'&find='+JSON.stringify(find) + '&fields='+JSON.stringify(fields)+ '&limit='+limit;
    console.log(url);
    return this.http.get(url).toPromise();
  }


  downloadCoinHistory(from:string, to:string, coin:string, limit:number){
    const find = {
      timestamp:{$gt: moment(from).valueOf(), $lt:moment(to).valueOf()}
    }
    const fields:any = { };
    fields[coin] = 1;
    fields.date =1;

    return this.geteData('last', find, fields, limit);
  }


}
