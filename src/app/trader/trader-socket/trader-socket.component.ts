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
  firstBuy: string;
  speed: string;
  amountPerMinute: string;
  totalPerMinute: string;
  avgRate: string;

  @Input() market: string;
  @Input() exchange: string;


  constructor(private sockets: SoketConnectorService) {
  }

  ngOnChanges(evt) {

    console.log(evt);

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

      if (Array.isArray(res.data)) {
        this.allTrades = res.data;
      } else {
        if (res.data.uuid) this.allTrades.push(res.data);
        else console.warn(res.data)
      }
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


    lastMinute.forEach(function (item: IVOTrade) {

      if (item.amountCoin > 0) {
        (firstBuy === 0) ? firstBuy = item.rate : lastBuy = item.rate;
      } else {

      }

      amountBase += Math.abs(item.amountCoin) * item.rate;
      amountCoin += Math.abs(item.amountCoin);
      total += item.amountCoin * item.rate;
    });

    this.avgRate = Math.round(amountBase / amountCoin).toLocaleString();
    this.amountPerMinute = Math.round(amountBase).toLocaleString();
    this.totalPerMinute = Math.round(total).toLocaleString();
    this.firstBuy = Math.round(firstBuy).toLocaleString();
    this.lastBuy = Math.round(lastBuy).toLocaleString();

    this.allTrades = lastMinute;
  }


}
