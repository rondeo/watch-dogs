import { Injectable } from '@angular/core';
import {VOOrder} from "../models/app-models";
import {Observable} from "rxjs/Observable";
import {serialize} from "@angular/compiler/src/i18n/serializers/xml_helper";



export interface APIBuySellService{
  sellLimit(base:string, coin:string, quantity: number, rate: number): Observable<VOOrder>;
  buyLimit(base:string, coin:string, quantity: number, rate: number): Observable<VOOrder>;
}


@Injectable()
export class BuySellService {


  constructor() { }





  onError(error){

  }

}
