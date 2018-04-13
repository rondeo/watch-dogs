import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {IVOTrade, SoketConnectorService} from "../../sockets/soket-connector.service";

@Component({
  selector: 'app-trader-socket',
  templateUrl: './trader-socket.component.html',
  styleUrls: ['./trader-socket.component.css']
})
export class TraderSocketComponent implements OnInit, OnChanges {

  private allTrades: IVOTrade[] = [];

  lastBuy: string;
  lastSell: string;

  firstSell: string;
  firstBuy: string;


  totalBuy: string;
  totalSell: string;

  diffSellBuyPrice: string;

  speed: string;
  amountPerMinute: string;
  totalPerMinute: string;


  avgRate: string;

  avgSellPrice:string;
  avgBuyPrice:string;


  @Input() market: string;
  @Input() exchange: string;


  constructor(private sockets: SoketConnectorService) {
  }

  ngOnChanges(evt) {

    // console.log(evt);

  }

  private sub1;
  private interval;

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
    this.sub1 = this.sockets.getSubscription(exchange, channel, market).subscribe(res => {
      // console.log(res);
      if (res.channel !== channel || res.exchange !== exchange || res.market !== market) {
        console.warn(res);
        return;
      }

      //if (Array.isArray(res.data)) {
      // this.allTrades = res.data;
      //} else {
      if (res.data.uuid) this.allTrades.push(res.data);
      else console.warn(res.data)
      // }
    })

  }

  ngOnDestroy() {
    this.sub1.unsubscribe();
    clearInterval(this.interval);
  }

  myTick() {

    let now = Date.now();
    now = now - (60 * 1000);

    let lastMinute = this.allTrades.filter(function (item) {
      return item.timestamp > now;
    });

    this.speed = lastMinute.length.toString();

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
    let amounrBaseSell = 0;
    let amountCoinSell = 0;

    lastMinute.forEach(function (item: IVOTrade) {

      if (item.amountCoin > 0) {
        amountCoinBuy += item.amountCoin;
        amountBaseBuy += item.amountCoin * item.rate;

        (firstBuy === 0) ? firstBuy = item.rate : lastBuy = item.rate;
      } else {
        amountCoinSell +=  Math.abs(item.amountCoin);
        amounrBaseSell +=  Math.abs(item.amountCoin) * item.rate;

        (firstSell === 0) ? firstSell = item.rate : lastSell = item.rate;
      }

      amountBase += Math.abs(item.amountCoin) * item.rate;
      amountCoin += Math.abs(item.amountCoin);
      total += item.amountCoin * item.rate;
    });

    if(amountCoinSell && amountCoinBuy){
      const avgSellPrice = amounrBaseSell / amountCoinSell;
      const avgBuyPrice = amountBaseBuy / amountCoinBuy;
      this.avgSellPrice = avgSellPrice.toLocaleString();
      this.avgBuyPrice = avgBuyPrice.toLocaleString();

      const diff = (100 * (avgSellPrice - avgBuyPrice) / avgBuyPrice).toFixed(2);

      this.diffSellBuyPrice = diff;

    } else this.diffSellBuyPrice = 'inf';



    this.totalBuy = Math.round(amountBaseBuy).toLocaleString();
    this.totalSell = Math.round(amounrBaseSell).toLocaleString();

    this.avgRate = Math.round(amountBase / amountCoin).toLocaleString();

    this.amountPerMinute = Math.round(amountBase).toLocaleString();

    this.totalPerMinute = Math.round(total).toLocaleString();

    this.firstBuy = Math.round(firstBuy).toLocaleString();
    this.lastBuy = Math.round(lastBuy).toLocaleString();

    this.firstSell = Math.round(firstSell).toLocaleString();
    this.lastSell = Math.round(lastSell).toLocaleString();

    this.allTrades = lastMinute;
  }


}
