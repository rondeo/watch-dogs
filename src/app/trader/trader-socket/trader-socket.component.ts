import {Component, Input, OnChanges, OnDestroy, OnInit} from '@angular/core';
import {IVOTrade, SoketConnectorService} from '../../adal/sockets/soket-connector.service';
import {DatabaseService} from '../../adal/services/database.service';
import {ApiMarketCapService} from '../../adal/apis/api-market-cap.service';
import * as moment from 'moment';
@Component({
  selector: 'app-trader-socket',
  templateUrl: './trader-socket.component.html',
  styleUrls: ['./trader-socket.component.css']
})
export class TraderSocketComponent implements OnInit, OnChanges, OnDestroy {


  constructor(
    private sockets: SoketConnectorService,
    private marketCap: ApiMarketCapService
    //  private database: DatabaseService
  ) {
  }

  private allTrades: IVOTrade[] = [];
  private lastTrades: IVOTrade[] = [];

  lastBuy: string;
  time: string;
  newTradesLength: number;
  /* lastSell: string;

   firstSell: string;
   firstBuy: string;

   totalBuy: string;
   totalSell: string;

   diffSellBuyPrice: string;*/


  /* amountPerMinute: string;
   totalPerMinute: string;

 */
  avgRate: string;
  perMinute: number;
  totalBuy: string;
  totalSell: string;

  /* avgSellPrice: string;
   avgBuyPrice: string;*/


  @Input() market: string;
  @Input() exchange: string;

  private sub1;
  private interval;

  coinPrice: number;


  /* saveInDB(data:any){
     this.database.saveData(this.exchange + '_' + this.market, data).then(res=>{
       console.log(res);
     });
   }*/
  ngOnChanges(evt) {

    // console.log(evt);

  }

  ngOnInit() {
    this.interval = setInterval(() => this.myTick(), 1000);
    this.subscribeForChannel();
  }

  subscribeForChannel() {


    const market = this.market;
    const exchange = this.exchange;

    const channel = 'trades';
    console.log(exchange + '   ' + market);
    if (!market || !exchange) return;
    const ar = market.split('_');
    this.marketCap.getTicker().then(MC => {
      this.coinPrice = MC[ar[1]].price_usd;
    });


    this.sub1 = this.sockets.getSubscription(exchange, channel, market).subscribe(res => {
      // console.log(res);
      if (res.channel === 'inittrades') {
        this.allTrades = res.data;
        return;
      }
      if (res.channel !== channel || res.exchange !== exchange || res.market !== market) {
        console.warn(res);
        return;
      }

      if (res.data.uuid) {
        this.lastTrades.push(res.data);
      } else console.warn(res.data);
      // }
    });
  }

  ngOnDestroy() {
    this.sub1.unsubscribe();
    clearInterval(this.interval);
  }

  myTick() {
    this.time = moment().format('HH:mm:ss');
    let now = Date.now();
    let lastTrades = this.lastTrades;
    this.newTradesLength = this.lastTrades.length;
    if (!this.newTradesLength) return;

    let sum = 0;
    lastTrades.forEach(function (o) {
      sum += Math.abs(o.rate);
    });

    const avg: number = (sum / lastTrades.length);

    this.avgRate = avg.toPrecision(5);
    const ago10Min = now - 10 * 60 * 1000;
    const ago1Min = now - 60000;


    const trades10Min = this.allTrades.concat(lastTrades).filter(function (o) {
      return o.timestamp > ago10Min;
    });

    const trades1Min = trades10Min.filter(function (o) {
      return o.timestamp > ago1Min;
    });

    // console.log(trades1Min);
    let totalBuy = 0;
    let totalSell = 0;
    trades1Min.forEach(function (o) {
      if (o.amountCoin < 0) totalSell += Math.abs(o.amountCoin);
      else totalBuy += o.amountCoin;
    });

    const price = this.coinPrice;
    this.totalBuy = Math.round(totalBuy * price).toLocaleString();
    this.totalSell = Math.round(totalSell * price).toLocaleString();
    this.perMinute = trades1Min.length;


    this.allTrades = trades10Min;


    this.lastTrades = [];
    /*
       /!* let lastMinute = this.allTrades.filter(function (item) {
          return item.timestamp > now;
        });*!/

        const speed = lastMinute.length;

        if (lastMinute.length === 0) {
          console.log(this.exchange + '   ' + this.market + 'length 0 ');
          return;
        }

        //  const lastMinute = _.orderBy(ar, 'timestamp');


        let total = 0;
        let amountCoin = 0;
        let amountBase = 0;
        let firstBuy = 0;
        let lastBuy = 0;
        let firstSell = 0;
        let lastSell = 0;
        let amountBaseBuy = 0;
        let amountCoinBuy = 0;
        let amountBaseSell = 0;
        let amountCoinSell = 0;
        let maxBuy = 0;
        let maxSell = 0;
        let dustSell = 0;
        let dustBuy = 0;

        lastMinute.forEach(function (item: IVOTrade) {

          if (item.amountCoin > 0) {
            amountCoinBuy += item.amountCoin;
            amountBaseBuy += item.amountCoin * item.rate;
            if(amountBaseBuy > maxBuy) maxBuy = amountBaseBuy;
            if(amountCoinBuy < 300) dustBuy ++;

            (firstBuy === 0) ? firstBuy = item.rate : lastBuy = item.rate;
          } else {
            amountCoinSell +=  Math.abs(item.amountCoin);
            amountBaseSell +=  Math.abs(item.amountCoin) * item.rate;
            if(amountBaseSell > maxSell) maxSell = amountBaseSell;
            if(amountCoinSell < 300) dustSell ++;

            (firstSell === 0) ? firstSell = item.rate : lastSell = item.rate;
          }

          const amount =  item.amountCoin * item.rate


          amountBase += Math.abs(item.amountCoin) * item.rate;
          amountCoin += Math.abs(item.amountCoin);
          total += item.amountCoin * item.rate;
        });

        let avgSellPrice;
        let avgBuyPrice;

        if(amountCoinSell && amountCoinBuy){
          avgSellPrice = amountBaseSell / amountCoinSell;
          avgBuyPrice = amountBaseBuy / amountCoinBuy;
          this.avgSellPrice = avgSellPrice.toLocaleString();
          this.avgBuyPrice = avgBuyPrice.toLocaleString();

          const diff = (100 * (avgBuyPrice - avgSellPrice) / avgSellPrice).toFixed(4);

          this.diffSellBuyPrice = diff;

        } else this.diffSellBuyPrice = 'inf';

        const market = this.market;
        const avgRate = amountBase / amountCoin;

      /!*  this.saveInDB({
          amountBaseBuy,
          amountBaseSell,
          avgSellPrice,
          avgBuyPrice,
          maxBuy,
          maxSell,
          dustSell,
          dustBuy,
          speed,
          avgRate
        });*!/

        this.speed = speed.toString();
        this.totalBuy = Math.round(amountBaseBuy).toLocaleString();
        this.totalSell = Math.round(amountBaseSell).toLocaleString();

        this.avgRate = Math.round(avgRate).toLocaleString();

        this.amountPerMinute = Math.round(amountBase).toLocaleString();

        this.totalPerMinute = Math.round(total).toLocaleString();

        this.firstBuy = Math.round(firstBuy).toLocaleString();
        this.lastBuy = Math.round(lastBuy).toLocaleString();

        this.firstSell = Math.round(firstSell).toLocaleString();
        this.lastSell = Math.round(lastSell).toLocaleString();*/
  }


}
