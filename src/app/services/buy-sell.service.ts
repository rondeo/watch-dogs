import { Injectable } from '@angular/core';
import {VOOrder} from "../models/app-models";
import {Observable} from "rxjs/Observable";
import {serialize} from "@angular/compiler/src/i18n/serializers/xml_helper";
import {SOBuySell} from "../bittrex/bittrex-private.service";


export interface APIBuySellService{
  sellLimit(market: string, quantity: number, rate: number): Observable<SOBuySell>;
  buyLimit(market: string, quantity: number, rate: number): Observable<SOBuySell>
}


@Injectable()
export class BuySellService {

  private uuid:string;
  private privateService:APIBuySellService;
  constructor() { }


  setService(service:APIBuySellService){
    this.privateService = service;
  }



  onError(error){

  }

}
