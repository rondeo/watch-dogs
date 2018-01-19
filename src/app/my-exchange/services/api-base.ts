import {StorageService} from "../../services/app-storage.service";
import {Observable} from "rxjs/Observable";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {VOMarket, VOMarketCap} from "../../models/app-models";
import {MarketCapService} from "../../market-cap/market-cap.service";
import {Mappers} from "../../com/mappers";

export abstract class ApiBase {

  apiKey: string;
  password: string;
  isLogedInSub: BehaviorSubject<boolean> = new BehaviorSubject(false);

  exchange: string;
  storage: StorageService;
  marketCap:MarketCapService;

  constructor(
    storage: StorageService,
    exchange: string,
    marketCap:MarketCapService
  ) {
    this.exchange = exchange;
    this.storage = storage;
    this.marketCap = marketCap;
  }


  private coinsSub:BehaviorSubject<{[symbol:string]:VOMarketCap}> = new BehaviorSubject<{[p: string]: VOMarketCap}>(null);
  getCurrencies():Observable<{[symbol:string]:VOMarketCap}> {
    if(!this.coinsSub.getValue())this.loadAllMarketSummaries();

    return this.coinsSub.asObservable();

  }


  abstract loadAllMarketSummaries():void;

  marketsAr$():Observable<VOMarket[]>{
    return this.marketsArSub.asObservable();
  }
  marketsOnj$():Observable<{[pair:string]:VOMarket}>{
    return this.marketsObjSub.asObservable();
  }

  private marketsObjSub:BehaviorSubject<{[pair:string]:VOMarket}> = new BehaviorSubject<{[pair:string]:VOMarket}>(null);
  private marketsArSub:BehaviorSubject<VOMarket[]> = new BehaviorSubject<VOMarket[]>(null);
  isLoadinMarkets:boolean = false;

  bases:string[];
  protected setMarketsData( marketsAr, indexed, bases){
    this.marketCap.getCoinsObs().subscribe(MC=>{
      if(!MC) return;

      let localCoins:{[symbol:string]:VOMarketCap} = {};
      marketsAr.forEach(function (item:VOMarket) {
        let mcBase = MC[item.base] || {
          price_usd:0,
          percent_change_1h:0,
          percent_change_24h:0,
          percent_change_7d:0
        };
        let mcCoin = MC[item.coin];
        if(mcCoin) localCoins[item.coin]= mcCoin;


        Mappers.mapDisplayValues1(item, mcBase.price_usd, mcBase.percent_change_1h, mcBase.percent_change_24h, mcBase.percent_change_7d , mcCoin);
      })





      this.coinsSub.next(localCoins);
      this.bases = bases;
      this.marketsObjSub.next(indexed);
      this.marketsArSub.next(marketsAr);
    })



  }



  marketsSelected: string[];

  getMarketsSelected(): string[] {
    if (!this.marketsSelected) this.marketsSelected = JSON.parse(this.storage.getItem(this.exchange + '-markets-selected') || '[]');
    return this.marketsSelected;

  }

  saveMarketsSelected() {
    let ar = this.getMarketsSelected();
    this.storage.setItem(this.exchange + '-markets-selected', JSON.stringify(ar))

  }


  login(apiKey: string, password: string, isSave: boolean) {
    this.apiKey = apiKey;
    this.password = password;
    //console.log(this.apiKey, password);
    if (isSave) this.storage.setItem(this.exchange + '-credentials', JSON.stringify({
      apiKey: apiKey,
      password: password
    }), true);
    if (apiKey && password) this.isLogedInSub.next(true);
    else this.isLogedInSub.next(false);
  }

  removeSavedLogin() {
    this.storage.removeItem(this.exchange + +'-credentials');
  }

  autoLogin(): void {
    //if (!this.storage.isLoggedIn()) return ;
    let str = this.storage.getItem(this.exchange + '-credentials', true);
    //console.warn('autoLogin ', str);
    if (str) {
      let credentials: { apiKey: string, password: string } = JSON.parse(str);
      // console.log(credentials);
      if (credentials && credentials.apiKey && credentials.password) this.login(credentials.apiKey, credentials.password, false);
    }
  }

  isLogedIn$(): Observable<boolean> {
    return this.isLogedInSub.asObservable();
  }


  logout() {
    this.apiKey = null;
    this.password = null;
    this.removeSavedLogin();
    this.isLogedInSub.next(false)
  }



}