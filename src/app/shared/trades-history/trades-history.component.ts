import {Component, Input, OnChanges, OnDestroy, OnInit} from '@angular/core';
import {ConnectorApiService} from "../../my-exchange/services/connector-api.service";
import {ChannelEvents, Channels, IChannel} from "../../my-exchange/services/apis/socket-models";
import {VOOrder} from "../../my-exchange/services/my-models";
import * as _ from 'lodash';

@Component({
  selector: 'app-trades-history',
  templateUrl: './trades-history.component.html',
  styleUrls: ['./trades-history.component.css']
})
export class TradesHistoryComponent implements OnInit, OnChanges, OnDestroy {

  @Input() exchange:string;
  @Input() base:string;
  @Input() coin:string;
  @Input() priceBaseUS:number;


  amountSell:number;
  amountBuy:number;

  accummulate:VOOrder[] = [];

  currentPrice:number;

  accumSum:number = 0;

  deals:number;
  inteval;

  constructor(
    private connector:ConnectorApiService
  ) { }


  ngOnDestroy(){
    clearInterval(this.inteval);
    this.sub.unsubscribe();
  }

  ngOnChanges(evt){
    //console.warn(evt);
  }

  ngOnInit() {

    this.subscribe();
    this.inteval = setInterval(()=>this.analize(), 2000);

  }

  archive:VOOrder[] = [];

  addToArchive(ar:VOOrder[]){
    if(ar.length ===0 ) return;
    ar = _.sortBy(ar, 'timestamp', 'desc');

    this.archive = this.archive.concat(ar);
  }

  analize(){
    let ar = this.accummulate;
    this.deals = ar.length;
    if(!ar.length) return;
    let sum = 0;
    let amount = 0;

     ar.forEach(function (item) {
      amount += item.amountBaseUS;
      sum += item.amountBaseUS * item.priceBaseUS;
    })

    this.accumSum = 0;


    //console.warn(sum, amount);
    this.currentPrice  = +(sum/amount).toPrecision(4);
    this.accummulate = [];
    this.addToArchive(ar);
  }


  parseData(data:VOOrder){
    if(this.priceBaseUS){
      data.amountBaseUS = data.amountCoin * data.rate * this.priceBaseUS;
      data.priceBaseUS = data.rate * this.priceBaseUS;
      this.accumSum += Math.round(data.action==='BUY'? data.amountBaseUS:-data.amountBaseUS);
      this.accummulate.push(data);
    }

  }

  sub;
  subscribe(){
    console.log('subscribe ', this.base, this.coin, this.exchange);
    if(this.base && this.coin && this.exchange){
     /* let ch:IChannel = this.connector.bitfinex.getChannel(Channels.TRADES, this.base, this.coin);

     this.sub =  ch.subscribe(ChannelEvents.DATA, res=>{
        //console.log(res);
        this.parseData(res)

      })

      let cb2 = ch.subscribe(ChannelEvents.HEART_BEAT, hb=>{
        console.log('HB '+ hb);
      });
      */

    }

  }



}
