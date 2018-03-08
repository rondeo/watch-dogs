import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";

@Injectable()
export class DatabaseService {

  constructor(
    private http:HttpClient
  ) { }


  saveMarket(market:any):Promise<any>{
    let url ='http://localhost:8080/mongodb';
    console.log(url);
    return this.http.post(url,{follow:market}).toPromise()

  }

}
