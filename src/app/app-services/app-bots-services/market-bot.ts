import {StorageService} from '../../services/app-storage.service';
import {ApisPrivateService} from '../../apis/api-private/apis-private.service';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import * as _ from 'lodash';
import {VOBalance} from '../../models/app-models';
import {CandlesService} from '../candles/candles.service';
import {BuyOnDown} from './buy-on-down';
import {VOCandle} from '../../models/api-models';
import set = Reflect.set;
export class MarketBot {

  private history: string[]= [];
  base: string;
  coin: string;
  balanceBase: VOBalance;
  balanceCoin: VOBalance;
  candlesInterval = '5m';
  buyOnDown: BuyOnDown;

  constructor(
    public exchange: string,
    public market: string,
    public amountCoin: number,
    private storage: StorageService,
    private apiPrivate: ApiPrivateAbstaract,
    private apiPublic: ApiPublicAbstract,
    private candlesService: CandlesService
  ) {
    this.buyOnDown = new BuyOnDown(market, this.apiPrivate);
    this.buyOnDown.buySignal = (price) => {
     this.buySignal(price);
    }

    this.buyOnDown.log = (message) =>{
      this.log(message);
    };
    this.init().then(()=>{
      this.start();
    });
  }

  log(message: string){
    console.log(this.market + message);
    this.history.push(message);
  }
  buySignal(price){
    console.log(' BUY NOW');

  }

  async init(){
    const ar = this.market.split('_');
    this.base = ar[0];
    this.coin = ar[1];

    this.apiPrivate.balances$().subscribe(balances =>{
      if(!balances) return;
      const bb = _.find(balances,{symbol:this.base});
      const bc = _.find(balances,{symbol:this.coin});
        this.balanceBase = bb;
        this.balanceCoin = bc;
    });

    this.apiPrivate.allOpenOrders$().subscribe(orders =>{
      if(!orders) return;
      const myOrder = _.find(orders, {symbol:this.coin});
      console.log(' my order ', myOrder);
    })
  }

  async tick(candles: VOCandle[]){
  //  console.log(candles);
    setTimeout(async ()=>{
      if(!this.history.length) return;
      const id = 'bot-history-' + this.market;
      let history: string[] = (await this.storage.select(id)) || [];
      history = history.concat(this.history);
      this.history = [];
      this.storage.upsert(id,history);
    }, 1000);

    if(!this.balanceCoin || (this.balanceCoin.available + this.balanceCoin.pending) < (this.amountCoin/2)){
      this.buyOnDown.checkToBuy(candles);
      return;
    }
    const last3 = _.takeRight(candles, 3);

    const last = _.last(candles);
   console.log(this.market, last3, last.time);


  }

  interval;
  start(){
    console.log(this);
    this.interval = setInterval(()=> {
      this.candlesService.getCandles(this.exchange, this.market, this.candlesInterval).then(candles =>{
        if(!candles) throw new Error(' no candles ' + this.exchange+this.market + this.candlesInterval);
        this.tick(candles);
      })

    }, 10000);
  }
  stop(){
    clearInterval(this.interval);
    this.interval = 0;
  }



}
