import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApisPublicService} from '../../apis/apis-public.service';
import {VOMarketCap} from '../../models/app-models';
import {VOCandle, VOMCObj} from '../../models/api-models';
import {MATH} from '../../com/math';
import * as _ from 'lodash';
import {MatDialog, MatSnackBar} from '@angular/material';
import * as moment from 'moment';
import {StorageService} from '../../services/app-storage.service';
import {Router} from '@angular/router';
import {ScanMarketsService} from '../../app-services/scanner/scan-markets.service';
import {Subscription} from 'rxjs/Subscription';
import {DialogInputComponent} from '../../material/dialog-input/dialog-input.component';
import {CandlesStats} from '../../app-services/scanner/candles-stats';

@Component({
  selector: 'app-scan-markets',
  templateUrl: './scan-markets.component.html',
  styleUrls: ['./scan-markets.component.css']
})
export class ScanMarketsComponent implements OnInit, OnDestroy {

  coin: string;
  exchange: string = 'binance';
  market: string;
  currentData: any[];
  analysData: any[];
  MC: VOMCObj;
  notifications: any[];
  coinsAvailable: VOMarketCap[];

  private selectedCoin: string;
  private selectedMarket: string;

  constructor(
    private marketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private storage: StorageService,
    private router: Router,
    private scanner: ScanMarketsService
  ) {


   /* this.apisPublic.getExchangeApi('binance').startRefrshTicker();

    this.apisPublic.getExchangeApi('binance').ticker5min$('BTC_KMD').subscribe(ticker =>{
      console.log(ticker);
    })*/
  }

  sub1: Subscription;
  sub2: Subscription;
  sub3: Subscription;

  async ngOnInit() {
   this.initAsync();
  }

  onExcludeClick(evt){
    console.log(evt);
    const market = evt.item.market

    if(evt.prop === 'market'){
      this.showMarket(market);
    } else if(evt.prop ==='x') {
      this.scanner.removeExclude(this.exchange, market).then(()=>{
        this.showExcludes();
      })
    }

  }
  onExcludesClick(){
    if(!this.excludes) this.showExcludes();
    else this.hideExcludes();
  }
  excludes: any[];

  async showExcludes(){
   this.excludes = ((await this.scanner.getExcludes(this.exchange)) || [])
     .map(function (o) {
     return {
       market:o.market,
       reason: o.reason,
       postpone:moment(o.postpone).format('DD HH:mm'),
       x:'X'
     }
   })
  }
  hideExcludes(){
    this.excludes = null;
  }
  async initAsync(){
    const sub = await this.scanner.notifications$();
    this.sub1 = sub.subscribe(notes => {
      this.notifications = notes;
    });
    this.sub2 = this.scanner.currentResult$().subscribe(curr =>{

      this.currentData = [curr];
    })
  }

  ngOnDestroy() {
    this.unsubscribe();
  }

  unsubscribe() {
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.sub2.unsubscribe();
    if (this.sub3) this.sub3.unsubscribe();
  }

  isRunning;

  async setAvaliableCoins(markets: string[]) {
    const coins: string[] = markets.map(function (o) {
      return o.split('_')[1]
    });
    const MC = await this.marketCap.getTicker();
    this.coinsAvailable = coins.map(function (o) {
      return MC[o] || new VOMarketCap({symbol: o});
    })
  }
/*
  async subscribe() {
    this.unsubscribe();
    const scanner: ScannerMarkets = this.scanner.getScanner(this.exchange);

    this.sub1 = scanner.current$()
      .subscribe(curr => {
        //  console.log(curr);
        this.currentData = [curr];
      });

    this.sub2 = (await scanner.notifications$())
      .subscribe(notes => {

        // console.log(notes);
        this.notifications = notes;
      });
    this.sub3 = scanner.running$()
      .subscribe(run => {
        this.isRunning = run;
      })

  }*/

  analizeMarket: string;
  analizeTime: string;
  analizeInterval = '30m';

  onAnaliseCandlesClick() {
    const api = this.apisPublic.getExchangeApi(this.exchange);
    //  const to = moment('2018-10-08T04:30:00').valueOf()
    api.downloadCandles(this.analizeMarket, this.analizeInterval, 200, moment(this.analizeTime).valueOf())
      .then(res => {
        this.candles = res;
        this.volumes = res.map(function (o) {
          return o.Volume;
        })
      })
  }

  onCoinSelected(coin: VOMarketCap) {
    const symbol = coin.symbol;
    this.coin = symbol;
    let market = 'BTC_' + symbol;

    this.openMarket(this.exchange, market);

    this.analizeMarket = market;


    // this.downloadCandles(this.market);
  }

  onCurrentMarketClick() {

    this.openMarket(this.exchange, this.market);
  }

  save() {
    this.storage.upsert('scan-notifications', this.notifications);
  }

  candles: VOCandle[];

  volumes: number[];






  onDatasetClick(obj) {
    const item = obj.item;
    const prop = obj.prop;
    const market = item.market;
    const ar = market.split('_');
    this.selectedCoin = ar[1];
    this.selectedMarket = market;


    if (prop === 'x') {

      const ref = this.dialog.open(DialogInputComponent, {data:{message:'Suspend market for hours', userInput: '3'}});
      ref.afterClosed().subscribe(res =>{
        if(res){
          const suspend = +res.userInput;
          if(isNaN(suspend)) this.scanner.deleteNotification(this.exchange, market);
          else this.scanner.addExclude(this.exchange, market, 'user ' + suspend + 'h', suspend);
        }
      })

    }
    if (prop === 'LH') {
      this.router.navigateByUrl('my-exchange/buy-sell/' + this.exchange + '/' + this.market);
    }
    if (prop === 'market') {
      this.showMarket(market);
      // console.log(candles);
      // console.log(market);

    }
  }

  showMarket(market: string) {


    this.scanner.getCandles(this.exchange, market)
      .then(res => {
        //  console.log(res);
        if (!res) {
           console.log(' no candles for ' + market);
          this.candles = null;
          this.volumes = null;
          return
        }
        res = _.clone(res);
        // const api = this.apisPublic.getExchangeApi(this.exchange)
        // api.downloadCandles(market, scanner.interval, 200).then(res => {
        //  console.log(res);
        this.candles = res;
        this.volumes = res.map(function (o) {
          return o.open > o.close ? -o.Volume : o.Volume;
        })
        this.analize(this.candles, market)
      });
    this.openMarket(this.exchange, market);
  }

  async analize(candles: VOCandle[], market: string) {
    const MC = (await this.marketCap.getTicker())[market.split('_')[1]];

    const data = await CandlesStats.analyze(candles, market, MC);
    this.analysData = [data];
    console.log(data);
    const mydata = CandlesStats.analysData;
    console.log(mydata);


    // const maxVolume: VOCandle = _.first(sortedVol);
    // const percentMaxVolume = MATH.percent(maxVolume.high, maxVolume.low);
    //console.log('percentMaxVolume  ' + percentMaxVolume);
  }

  openMarket(exchange: string, market: string) {
    const api = this.apisPublic.getExchangeApi(exchange);
    const ar = market.split('_');
    const url = api.getMarketUrl(ar[0], ar[1]);
    window.open(url, exchange);
  }

  onClearMemoryClick() {
    if (confirm('Remove all data? ')) this.scanner.clearMemory(this.exchange)
      .then(res => {
        this.scanner.notifications(this.exchange)
        this.snackBar.open('Memory cleared', 'x', {duration: 3000});
      })

  }

  onStartClick() {
   /* const scanner: ScannerMarkets = this.scanner.getScanner(this.exchange);
    if (this.isRunning) scanner.stopScan();
    else scanner.start(['BTC'])
      .then(markets => {
        //  console.log(markets);
        this.setAvaliableCoins(markets);
      });*/
  }
}
