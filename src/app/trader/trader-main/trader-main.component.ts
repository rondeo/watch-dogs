import {Component, OnDestroy, OnInit} from '@angular/core';
import {IVOTrade, SoketConnectorService} from "../../sockets/soket-connector.service";
import {setInterval} from "timers";
import * as _ from 'lodash';

@Component({
  selector: 'app-trader-main',
  templateUrl: './trader-main.component.html',
  styleUrls: ['./trader-main.component.css']
})
export class TraderMainComponent implements OnInit, OnDestroy {


  private bitFinexTrades: IVOTrade[] = [];

  lastBuy: string;
  firstBuy: string;
  speed: string;
  amountPerMinute: string;
  totalPerMinute: string;
  avgRate: string;


  constructor(private sockets: SoketConnectorService) {
  }

  private sub1;
  private interval;

  ngOnInit() {
    const market = 'USDT_BTC';
    const exchange = 'bitfinex';
    const channel = 'trades';
    this.sockets.getSubscription(exchange, channel, market).subscribe(res => {
      // console.log(res);
      if (res.channel !== channel || res.exchange !== exchange || res.market !== market) {
        console.warn(res);
        return;
      }
      if (Array.isArray(res.data)) {
        this.bitFinexTrades = res.data;
      } else this.bitFinexTrades.push(res.data);
    })

    this.interval = setInterval(() => this.myTick(), 1000);
  }

  ngOnDestroy() {
    this.sub1.unsubscribe();
    clearInterval(this.interval);
  }

  myTick() {
    if (this.bitFinexTrades.length === 0) {
      console.log('length 0');
      return;
    }
    let now = Date.now();
    now = now - (60 * 1000);

    let lastMinute = this.bitFinexTrades.filter(function (item) {
      return item.timestamp > now;
    });

  //  const lastMinute = _.orderBy(ar, 'timestamp');

    this.speed = lastMinute.length.toString();
    let total = 0;
    let amountCoin = 0;
    let amountBase = 0;
    let firstBuy = 0;
    let lastBuy = 0;
    let firstSell = 0;
    let lastSell = 0;


    lastMinute.forEach(function (item: IVOTrade) {

      if (item.amountCoin > 0) {
        (firstBuy === 0) ? firstBuy = item.rate:lastBuy = item.rate;
      }else {

      }

      amountBase += Math.abs(item.amountCoin) * item.rate;
      amountCoin += Math.abs(item.amountCoin);
      total += item.amountCoin * item.rate;
    });

    this.avgRate = Math.round(amountBase / amountCoin).toLocaleString();
    this.amountPerMinute =  Math.round(amountBase).toLocaleString();
    this.totalPerMinute =  Math.round(total).toLocaleString();
    this.firstBuy =  Math.round(firstBuy).toLocaleString();
    this.lastBuy =  Math.round(lastBuy).toLocaleString();

    this.bitFinexTrades = lastMinute;

  }

}
