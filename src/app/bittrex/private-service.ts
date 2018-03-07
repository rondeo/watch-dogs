import {Subject} from "rxjs/Subject";
import {VOBalance, VOMarketCap, VOTransfer} from "../models/app-models";
import {Observable} from "rxjs/Observable";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {MyBot} from "./my-bot";
import {MarketCapService} from "../market-cap/market-cap.service";
import {SlackService} from "../services/slack.service";
import {HttpClient} from "@angular/common/http";
import {AuthHttpService} from "../services/auth-http.service";
import {StorageService} from "../services/app-storage.service";
import * as cryptojs from 'crypto-js';
import {MappersPrivate} from "../com/MappersPrivate";

export class PrivateService {

  apiKey: string;
  password: string;
  id:string;

  isLogedInSub: Subject<boolean>;

  private balances: VOBalance[];
  balancesSub: BehaviorSubject<VOBalance[]>;



  private transfers: VOTransfer[];
  private transfersSub: Subject<VOTransfer[]>;
  transfers$: Observable<VOTransfer[]>;

  private myBots: MyBot[];
  myBots$: Observable<MyBot[]>;
  private myBotsSub: BehaviorSubject<MyBot[]>;


  private MC:{[symbol:string]:VOMarketCap};

  constructor(
    private config:any,
  private http: HttpClient,
  public marketCap: MarketCapService,
  //public publicService: BittrexService,
  private slack:SlackService,
  public storage: StorageService,
  private auth:AuthHttpService
  ){


    this.id = config.exchange;
    console.log(config);
    this.balancesSub = new BehaviorSubject(this.balances);
    this.isLogedInSub = new Subject();

    this.transfersSub = new Subject();
    this.transfers$ = this.transfersSub.asObservable();



    this.marketCap.getCoinsObs().subscribe(MC => {
      this.MC = MC;
      console.log(this.id + ' MC ready');
      this.mapBalancesToMC();
    });

  }

  name():string{
    return this.id;
  }

  logout() {
    this.apiKey = null;
    this.password = null;
    this.removeSavedLogin();
    this.isLogedInSub.next(false);
  }


  login(apiKey: string, password: string, isSave:boolean) {
    this.apiKey = apiKey;
    this.password = password;
    console.log(apiKey, password);
    //console.log(this.apiKey, password);
    if(isSave)  this.storage.setItem(this.id+'-credentials', JSON.stringify({apiKey:apiKey, password:password}), true);
    if(apiKey && password)this.isLogedInSub.next(true);
    else this.isLogedInSub.next(false);
  }

  removeSavedLogin(){
    this.storage.removeItem(this.id+ '-credentials', true);
  }

  autoLogin(): void {
    //if (!this.storage.isLoggedIn()) return ;
    let str = this.storage.getItem(this.id+'-credentials', true);
    console.warn('autoLogin ', str);
    if (str) {
      let credentials: { apiKey: string, password: string } = JSON.parse(str);
      // console.log(credentials);
      if (credentials && credentials.apiKey && credentials.password) this.login(credentials.apiKey, credentials.password, false);
    }


    //return this.isLogedInSub.asObservable();
  }



  isLoadingBalances:boolean;
  refreshBalances():void {

    if(this.isLoadingBalances) return;
    this.isLoadingBalances = true;


    console.log('%c refreshBalances  ','color:pink');

    let command = 'returnBalances';

    this.call(command, {}).map(res => {

      if(!res){
        console.log('refreshBalances null');
        return null;
      }

      if(res.error){
        console.error(res);
        return [];
      }
      return MappersPrivate[this.id+'Balances'](res);
    }).toPromise().then(res=>{

      this.balances = res;
      this.isLoadingBalances = false;
      this.mapBalancesToMC();
    }).catch(err=>{
      this.isLoadingBalances = false;
      this.onError(err);

    });

    /*   })

       let sb = this._getBalances().subscribe(bals => {
         if (!bals) return;
         this.balances = bals;
         this.balancesSub.next(bals);
         sb.unsubscribe();
       })*/
  }




  private call(command:string, postData: any): Observable<any> {
    if (!this.apiKey) {
      console.error(' no key')
      return new BehaviorSubject(null).asObservable();
    }


    postData.command = command;
    postData.nonce = Math.ceil(Date.now() / 1000);




    let serialize = function(obj) {
      var str = [];
      for(var p in obj) str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));

      return str.join("&");
    }

    let str = serialize(postData);

    let signed = this.hash_hmac(str, this.password);
    let url = '/api/poloniex/private';


    return this.http.post(url, {key: this.apiKey, postData:str, signed: signed});

  }


  private mapBalancesToMC(){


    if(!this.balances || !this.MC) return;

   // console.log(this.MC);

    let ar = this.balances
    this.balances =  ar.filter(function (item) {

      let mc:VOMarketCap = this.MC[item.symbol];
      if(mc){
        item.id = mc.id;
        item.priceUS=mc.price_usd;
        item.balanceUS=+(item.priceUS * item.balance).toFixed(2);

        item.percent_change_1h = mc.percent_change_1h;
        item.percent_change_24h = mc.percent_change_24h;
        item.percent_change_7d = mc.percent_change_7d;
        return true;
      }else{
        return false;
      }
    }, {MC:this.MC});



    this.balancesSub.next(this.balances);
  }



   private hash_hmac(text, password) {
    let dg: any = cryptojs.HmacSHA512(text, password);
    return dg.toString(cryptojs.enc.Hex);
  }


 private onError(err){
    console.error(err);

  }

}
