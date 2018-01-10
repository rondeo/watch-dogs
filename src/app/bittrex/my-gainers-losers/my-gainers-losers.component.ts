import { Component, OnInit } from '@angular/core';
import {VOMarketCap} from "../../models/app-models";
import {MarketCapService} from "../../market-cap/market-cap.service";
import {Router} from "@angular/router";
import * as _ from 'lodash';
import {BittrexService} from "../../exchanges/services/bittrex.service";
import {MatDialog, MatSnackBar} from "@angular/material";
import {MarketViewComponent} from "../../shared/market-view/market-view.component";
import {ChatService} from "../chat-servica";
import {WebsocketService} from "../../shared/websocket-service";

var autobahn = require('autobahn');
var bittrex = require('node-bittrex-api');

@Component({
  selector: 'app-my-gainers-losers',
  templateUrl: './my-gainers-losers.component.html',
  styleUrls: ['./my-gainers-losers.component.css']
})
export class MyGainersLosersComponent implements OnInit {

  asc_desc='desc';

  allCoins:VOMarketCap[];
  top30:VOMarketCap[];

  sortBy:string = 'percent_change_24h';

  constructor(
    private router:Router,
    private marketCap:MarketCapService,
    private publicService:BittrexService,
    private dialog:MatDialog,
    private snackBar:MatSnackBar,
   //private dataService:DataService
  private socketService:WebsocketService
   // private chatService:ChatService
  ) { }

  onSymbolClick(mc:VOMarketCap){
   let sub =  this.publicService.searchCoinsMarkets([mc.symbol]).subscribe(res=>{

      if(res){

        setTimeout(()=>sub.unsubscribe(),100);
        if(res.length){

          let marketFirst = res[0].pair;
          let ar = marketFirst.split('_')

          this.publicService.getMarketHistory(ar[0], ar[1]).subscribe(hist=>{
            console.log(hist);

          });
          this.dialog.open(MarketViewComponent,{data:res} )
        }else {
          this.snackBar.open('No market for '+mc.symbol, 'x', {duration:3000});
          let allMarkets = this.publicService.getMarketsAr().map(res=>{
            return res.map(function (item) {
              return item.coin;
            })
          }).subscribe((coins)=>{
            console.log(coins);
          })
        }



      }
    })

    // let symbols:string[] = _.map(this.consAvailable,'symbol');

    //this.router.navigateByUrl('/market-cap/coin-exchanges/'+ mc.id);
  }

  onShowCartClick(mc:VOMarketCap) {

    // let symbols:string[] = _.map(this.consAvailable,'symbol');
    window.open('https://coinmarketcap.com/currencies/' + mc.id, '_blank');
  }

  private missingImages:string[] = [];
  private misingImagesTimeout;

  private stockQuote;
  private sub;
  ngOnInit() {

/*

    this.socketService.marketsDataSub.asObservable().subscribe(res=>{
      console.log(res);
    })
    this.socketService.isConnected.subscribe(isConnected=>{
      console.log(isConnected);
      //this.socketService.sendMessage(['BTC_ETH', 'USDT_ETH', 'USDT_BTC', 'BTC_DASH', 'BTC_CVC', 'BTC_QTUM']);
      this.socketService.sendMessage(['BTC_ETH', 'USDT_ETH', 'USDT_BTC', 'BTC_DASH', 'BTC_CVC', 'BTC_QTUM']);
    });

    this.socketService.getQuotes().subscribe(res=>{

      console.warn(res);

    });
*/




  //  this.sub = this.dataService.getQuotes()
    /*  .subscribe(quote => {
        console.log(quote);
        this.stockQuote = quote;
      });*/
    //this.chatService.connect();

 /*   this.chatService.connect().subscribe(res=>{
      console.warn(res);
    });
*/
    /*let sub = this.chatService.messages.subscribe((res)=>{
      console.log(res);

    //  console.log('this.chatService.messages   ', res)
// do your stuff
    });
*/
// some where in your code
   // sub.unsubscribe() // this will close the connection



  /*  bittrex.websockets.client(function() {
      console.log('Websocket connected');
      bittrex.websockets.subscribe(['BTC-ETH'], function(data) {
        if (data.M === 'updateExchangeState') {
          data.A.forEach(function(data_for) {
            console.log('Market Update for '+ data_for.MarketName, data_for);
          });
        }
      });
    });*/


   /* var wsuri = "wss://api.poloniex.com";

    var connection = new autobahn.Connection({
      url: wsuri,
      realm: "realm1"
    });

    connection.onopen = function (session) {
      console.log('connection.onopen',session);
      function marketEvent (args,kwargs) {
        console.log(args);
      }
      function tickerEvent (args,kwargs) {
        console.log(args);
      }
      function trollboxEvent (args,kwargs) {
        console.log(args);
      }

     // session.subscribe('BTC_ETH', marketEvent);
      session.subscribe('ticker', tickerEvent);
      //session.subscribe('trollbox', trollboxEvent);


  }

    connection.onclose = function () {
      console.log("Websocket connection closed");
    }


    connection.open();*/



  let sub = this.publicService.getCurrencies().subscribe(res=>{
    if(!res) return

    setTimeout(()=>sub.unsubscribe(),50);
      this.allCoins = Object.values(res);
      this.sortData();
    })


   /* this.marketCap.coinsAr$.subscribe(res=>{
      this.allCoins = res;

      this.sortData();
    });
    this.marketCap.refresh();*/
  }

  onSymbolSelected(symbol:string){
    console.log(symbol);
  }


  onFilterClick(){

    this.sortData();
  }

  sortData(){
    if(!this.allCoins) return;

    //let cap = this.data.filter(function (item) { return item.volume_usd_24h > this.limit && item.rank < this.rank;}, {limit:this.capLimit, rank:this.rank});

    let sorted =  _.orderBy(this.allCoins, this.sortBy, this.asc_desc);

    // console.log(sorted);
    this.top30= _.take(sorted, 30);
  }



 /* onTableclick(event){

    // console.log(event.srcElement);
    var target = event.target || event.srcElement || event.currentTarget;
    var idAttr = target.attributes.data;

    if(idAttr && idAttr.nodeValue)  console.log(idAttr.nodeValue);

    // var value = idAttr.id;
  }*/

  onHeaderClick(criteria:string):void{
    console.log(criteria);


    if(this.sortBy === criteria) {
      this.asc_desc = (this.asc_desc === 'asc')?'desc':'asc';
    }

    this.sortBy = criteria;
    this.sortData();
  }

}
