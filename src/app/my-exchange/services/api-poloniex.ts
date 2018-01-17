import {Observable} from 'rxjs/Observable';
import {AuthHttpService} from '../../services/auth-http.service';
import {APIBooksService} from "../../services/books-service";
import {VOOrderBook} from "../../models/app-models";
import {StorageService} from "../../services/app-storage.service";

import {ApiLogin} from "../../shared/api-login";
import {IExchangeConnector} from "./connector-api.service";
import {VOCtopia} from "./api-cryptopia";



export class ApiPoloniex extends ApiLogin implements IExchangeConnector{


  constructor(
    private http:AuthHttpService,
    storage:StorageService
  ) {
    super(storage, 'poloniex');

  }
  private booksObs:Observable<any>;
  getOrderBook(base:string, coin: string, depthMax = '50') {

    let url = 'api/cryptopia/getorderbook/' +base +'-' +coin + '/' + depthMax;
    if(!!this.booksObs) return this.booksObs;
    console.log(url);
    this.booksObs =  this.http.get(url).map(res => {
      let r = (<any>res).result;
      console.log('books ', r);
      this.booksObs = null
      return r;// MappersBooks.bittrex(r, price);

    });
    return this.booksObs;

  }

  getCurrencies():Observable<VOCtopia[]>{

    let url = '/api/cryptopia/currencies';
    return this.http.get(url).map(res=>{
      let obj = res.json();
      // console.log(obj);
      //let out:VOCryptopia[]=[];
      return obj.Data.map(function (item) {
        return item;

      });

    })
  }

  getPairs():Observable<VOCtopia[]>{

    let url = '/api/cryptopia/pairs';
    return this.http.get(url).map(res=>{
      let obj = res.json();
      // let out:VOCryptopia[]=[];
      return obj.markets.map(function (item) {
        return item;

      });

    })
  }

  getMarkets():Observable<VOCtopia[]>{

    let url = '/api/cryptopia/markets';
    return this.http.get(url).map(res=>{
      let obj = res.json();
      return obj.markets.map(function (item) {
        return item;

      });

    })
  }
}

