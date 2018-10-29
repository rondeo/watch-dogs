import {StorageService} from '../../services/app-storage.service';
import {ApisPrivateService} from '../../apis/api-private/apis-private.service';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import * as _ from 'lodash';
import {VOBalance} from '../../models/app-models';
import {CandlesService} from '../candles/candles.service';
export class MarketBot {
  priceBaseUS: number;
  priceCoinUS: number;
  base: string;
  coin: string;
  balanceBase: VOBalance;
  balanceCoin: VOBalance;
  candlesInterval = '5m';
  constructor(
    public exchange: string,
    public market: string,
    public history: string,
    private amountUS: number,
    private storage: StorageService,
    private apiPrivate: ApiPrivateAbstaract,
    private apiPublic: ApiPublicAbstract,
    private marketCap: ApiMarketCapService,
    private candlesService: CandlesService
  ) {
  }

  async init(){
    const ar = this.market.split('_');
    this.base = ar[0];
    this.coin = ar[1];
    const MC = await this.marketCap.getTicker();

    this.priceBaseUS = MC[this.base].price_usd;
    this.priceCoinUS = MC[this.coin].price_usd;

    this.apiPrivate.balances$().subscribe(balances =>{
      const bb = _.find(balances,{symbol:this.base});
      const bc = _.find(balances,{symbol:this.coin});
      if(!this.balanceBase){
        this.balanceBase = bb;
        this.balanceCoin = bc;
      }else {

      }
    })
  }

  async next(){
   const candles = await this.candlesService.getCandles(this.exchange, this.market, this.candlesInterval);
   if(!candles) throw new Error(' no candles ' + this.exchange+this.market + this.candlesInterval);
  //  console.log(candles);
    const last3 = _.takeRight(candles, 3);
   console.log(last3);

  }

  interval;
  start(){
    console.log(this);
    this.interval = setInterval(()=>this.next(), 10000);
  }

  stop(){
    clearInterval(this.interval);
    this.interval = 0;
  }

}
