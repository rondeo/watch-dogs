import {VOBooks, VOMarketCap, VOOrder} from "../../src/app/models/app-models";
import {ApiBase} from "../../src/app/my-exchange/services/apis/api-base";
import {MarketCollectorService} from "./market-collector.service";
import {VOTradesStats} from '../../src/app/com/utils-order';


export interface IBotData{
  startStats:VOTradesStats;
  timestamp:number;
  reports:string[];
  buyOrder:VOOrder;
  sellOrder:VOOrder;
}


export class FollowCoinController {

  private interval;
  private api:ApiBase;
  exchange:string;
  base:string;
  coin:string;
  amountCoin:number;
  rateStarted:number;
  pricaeBaseUSStart:number;
  coinMC:VOMarketCap;
  baseMC:VOMarketCap;
  currentRate:number;
  priceToMC:number;

  currentStats:VOTradesStats;


  constructor(private data:IBotData){
    this.exchange = data.startStats.exchange;
    this.base = data.startStats.base;
    this.coin = data.startStats.coin;
    this.amountCoin = data.buyOrder.amountCoin;
    this.pricaeBaseUSStart = data.startStats.priceBaseUS;
    this.rateStarted = data.startStats.rateLast;
  }


  sellCoin(){
    //let amountCoin = this.data.

  }



  getMarketStats(){
    MarketCollectorService.getOrdersStats(this.api, this.coinMC, this.baseMC).then((summary:VOTradesStats)=>{
      //console.log(summary);
      this.currentStats = summary;
      this.currentRate = summary.rateLast;
      this.report();
    })

  }


  report(){

   // console.log(this.data);

   /* let startPrice = this.data.startStats.coinMC.price_usd;
    let newPrice = this.coinMC.price_usd;

    console.log(' from ' +new Date(this.data.buyOrder.timestamp) + ' rank ' + this.coinMC.rank);
    let priceDiffMC = (100* (newPrice - startPrice)/startPrice).toFixed(2);

    console.log('onMC ' + priceDiffMC + '%  ' +this.exchange + ' ' + this.base + ' '+ this.coin + ' newPrice '+ newPrice +' startPrice ' +startPrice);
    console.log('start: 1h ' + this.data.startStats.coinMC.percent_change_1h + ' 24h ' +  this.data.startStats.coinMC.percent_change_24h);
    console.log('now: 1h ' +this.coinMC.percent_change_1h + ' 24h ' + this.coinMC.percent_change_24h);

    let priceDiffLocal =(100* (this.currentRate - this.rateStarted)/this.rateStarted).toFixed(2);
    console.log('ON '+ this.exchange +' ' +priceDiffLocal + ' % rate started '+ (this.rateStarted *this.pricaeBaseUSStart).toPrecision(5) + ' last price ' + (this.currentRate *this.pricaeBaseUSStart).toPrecision(5));
    console.log(' volume ' + this.currentStats.totalUS);
    console.log(this.data.reports);*/

  }


  getBooks(){
    this.api.downloadBooks(this.base, this.coin).subscribe((books:VOBooks)=>{
      //console.log(books.sell, this.amountCoin);
     //this.currentRate =  BooksService.getRateForAmountCoin(books.sell, this.amountCoin);
      this.report();
    })
  }


  tickMC(){


  }

  start(api:ApiBase){
    this.api = api;
    console.log(' FOLLOWING ' + this.exchange + ' '+ this.base + ' '+ this.coin + '   '+ this.data.reports);
    //this.interval = setInterval(()=>this.tick(), 10000);
  }

  toString():string{
    return JSON.stringify(this.data);
  }

  onMC(MC: { [p: string]: VOMarketCap }, i:number) {
    this.coinMC = MC[this.coin];
    this.baseMC = MC[this.base];

    setTimeout(()=>{
      this.getMarketStats();

    }, i* 5000);


  }
}
