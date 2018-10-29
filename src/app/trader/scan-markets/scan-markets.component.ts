import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
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
import {CandlesAnalys1} from '../../app-services/scanner/candles-analys1';
import {Subject} from 'rxjs/Subject';
import {CandlesAnalys2} from '../../app-services/scanner/candles-analys2';
import {ApiCryptoCompareService} from '../../apis/api-crypto-compare.service';
import {NotesHistoryComponent} from '../notes-history/notes-history.component';

@Component({
  selector: 'app-scan-markets',
  templateUrl: './scan-markets.component.html',
  styleUrls: ['./scan-markets.component.css']
})
export class ScanMarketsComponent implements OnInit, OnDestroy {

  coin: string;
  exchange: string = 'binance';
  // market: string;
  currentData: any[];
  analysData: any[];
  MC: VOMCObj;
  notifications: any[];
  notifications2: any[];
  coinsAvailable: VOMarketCap[];


  scannerSatatsSub: Subject<string> = new Subject();

  userExclude = 'NPXS';
  // private selectedCoin: string;
  private selectedMarket: string;

  constructor(
    private marketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService,
    private apiCryptoCompare: ApiCryptoCompareService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private storage: StorageService,
    private router: Router,
    public scanner: ScanMarketsService
  ) {


    /* this.apisPublic.getExchangeApi('binance').startRefrshTicker();

     this.apisPublic.getExchangeApi('binance').ticker5min$('BTC_KMD').subscribe(ticker =>{
       console.log(ticker);
     })*/
    window['MATH'] = MATH;
  }

  userMarket: string;


  onExcludeDownTrendClick(){
    this.scanner.excludeDownTrend();
  }
  onMarketInput(evt) {
    if (evt.code === 'Enter') this.showCandles(this.userMarket);
   //  console.log(evt, this.userMarket);
  }

  onCandlesIntrvalChange(){
    this.showCandles(this.userMarket);
  }
  sub1: Subscription;
  sub2: Subscription;
  sub3: Subscription;

  async ngOnInit() {
    this.initAsync();
  }

  onDeleteExcludesClick(){
    if(confirm('empty ecludes? ')) {
      this.scanner.removeExcludes()
    }
  }
  onExcludeClick(evt) {
    const market = evt.item.market;
    if (evt.prop === 'market') {
      this.showMarket(market);
    } else if (evt.prop === 'x') {
      this.scanner.removeExclude(this.exchange, market).then(() => {
        this.showExcludes();
      })
    }
  }


  onStarClick() {
    const market = this.selectedMarket;
    const ref = this.dialog.open(DialogInputComponent, {data: {message: market, userInput: '3'}});
    const sub = ref.afterClosed().toPromise().then(res => {
      if (res) {
        const msg = res.msg;
        this.scanner.addFavorite(market, msg);
      }
    })

    // this.scanner.addFavorite()
  }

  onFavoritesClick(obj) {
    //   console.log(obj);

    const item = obj.item;
    const prop = obj.prop;
    const market = item.market;
    const ar = market.split('_');
    if (prop === 'x') {
      if (confirm('remove from favorites ' + market + '?')) this.scanner.removeFavorite(market);
    }
    if (prop == 'market') this.showMarket(market);

  }

  favorites: any[];
  onFavoriteChange(evt) {
    if (evt.checked) {
      this.scanner.favoritesSub.subscribe(favs => {
        if (!favs) return;
        this.favorites = favs.map(function (o) {
          return {
            stamp: moment(o.stamp).format('DD HH:mm'),
            market: o.market,
            message: o.message,
            x: 'X'
          }
        });
      })
    } else {
      this.favorites = null;
    }
  }

  onExcludesChange(evt) {
    if (evt.checked) this.showExcludes();
    else this.hideExcludes();
  }

  excludes: any[];

  async showExcludes() {
    this.excludes = ((await this.scanner.getExcludes(this.exchange)) || [])
      .map(function (o) {
        return {
          market: o.market,
          reason: o.reason,
          stamp: moment(o.stamp).format('DD HH:mm'),
          postpone: moment(o.postpone).format('DD HH:mm'),
          x: 'X'
        }
      })
  }

  hideExcludes() {
    this.excludes = null;
  }

  async initAsync() {
    const sub = await this.scanner.notifications$();
    this.sub1 = sub.subscribe(notes => {
      this.notifications = _.filter(notes, 'a');
      this.notifications2 = _.reject(notes, 'a');
    });
    this.sub2 = this.scanner.currentResult$().subscribe(curr => {

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
  //  analizeInterval = '30m';

  /* onAnaliseCandlesClick() {
     const api = this.apisPublic.getExchangeApi(this.exchange);
     //  const to = moment('2018-10-08T04:30:00').valueOf()
     api.downloadCandles(this.analizeMarket, this.analizeInterval, 200, moment(this.analizeTime).valueOf())
       .then(res => {
         this.candles = res;
         this.volumes = res.map(function (o) {
           return o.Volume;
         })
       })
   }*/

  onCoinSelected(coin: VOMarketCap) {
    const symbol = coin.symbol;
    this.coin = symbol;
    let market = 'BTC_' + symbol;

    this.openMarket(this.exchange, market);

    this.analizeMarket = market;


    // this.downloadCandles(this.market);
  }

  onCurrentMarketClick() {

    this.openMarket(this.exchange, this.selectedMarket);
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


    if (prop === 'x') {
      const ref = this.dialog.open(DialogInputComponent, {data: {message: 'Suspend market for hours', userInput: '3'}});
      ref.afterClosed().subscribe(res => {
        if (res) {
          const suspend = +res.userInput;
          const msg = res.msg;
          if (isNaN(suspend)) this.scanner.deleteNotification(this.exchange, market);
          else this.scanner.addExclude(this.exchange, market, msg + ' ' + suspend + 'h', suspend);
        }
      })

    }
    /* if (prop === 'LH') {
       this.router.navigateByUrl('my-exchange/buy-sell/' + this.exchange + '/' + market);
     }*/
    if (prop === 'market') {
      this.showMarket(market);
    }else if(prop === 'result') {
      this.dialog.open( NotesHistoryComponent,{data:item} )
    }

  }

  mediaPointsFrom: number;
  mediaPointsTo: number;
  mediaPercent: number;


  showMarket(market: string, open = true) {
    this.userMarket = market;
    this.selectedMarket = market;
    this.apiCryptoCompare.getSocialStats(market.split('_')[1]).then(stats => {
      // console.log(stats);
      if (!stats) {
        this.mediaPointsFrom = -1;
        this.mediaPointsTo = -1;
        this.mediaPercent = 0;
        return;
      }
      this.mediaPointsFrom = stats.fromPoints;
      this.mediaPointsTo = stats.toPoints;
      this.mediaPercent = MATH.percent(stats.toPoints, stats.fromPoints);
    }).catch(err => {
      this.mediaPointsFrom = -1;
      this.mediaPointsTo = -1;
    })

    this.showCandles(market);
    if (open) this.openMarket(this.exchange, market);
  }

  async showCandles(market: string) {
    this.selectedMarket = market;
    const candles = await this.apisPublic.getExchangeApi(this.exchange).downloadCandles(market, this.candlesInterval, 200);
    if (!candles) {
      this.candles = null;
      this.volumes = null;
      return;
    }

    // console.log(market + ' pumpedUp ' +CandlesAnalys1.pumpedUp(candles));
    console.log(market + ' volume jump ', CandlesAnalys1.volumeJump(candles));
   //  console.log(market + ' trend ', CandlesAnalys1.MALats(_.takeRight(candles, 20)));

    const  c1 = candles.slice(candles.length-6, candles.length -2);

    console.log(market + ' is fall ', MATH.isFall(CandlesAnalys1.meds(c1)));

  //  console.log(market + ' progress ' +CandlesAnalys1.progress(candles, 24));
   // console.log(market + ' goingUp ' + CandlesAnalys1.goingUp(candles));
   //  console.log(market + ' lastVolume  ' + CandlesAnalys1.lastVolume(candles));
   // console.log(market + ' MA  ' + CandlesAnalys1.MA3(candles));

    this.candles = candles;
    this.volumes = candles.map(function (o) {
      return o.open > o.close ? -o.Volume : o.Volume;
    });

    this.analize(this.candles, market);
  }

  candlesInterval = '1m';


  async analize(candles: VOCandle[], market: string) {
    const MC = (await this.marketCap.getTicker())[market.split('_')[1]];
    const exchange = this.exchange;
    const data = await CandlesAnalys2.analyze({exchange, candles, market}, MC, null, null);
    this.analysData = [data];
    // console.log(data);
    // const mydata = CandlesStats.analysData;
    // console.log(mydata);


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
        this.scanner.notifications()
        this.snackBar.open('Memory cleared', 'x', {duration: 3000});
      })

  }

  onDownClick(){
    this.scanner.scanGoingDown();
  }
/*falIntrval
  onFallClick(){

    if(this.falIntrval){
      clearInterval(this.falIntrval);
      this.falIntrval = 0;
      return
    }
    this.scanner.scanForFall();
   this.falIntrval =  setInterval(()=>{
      this.scanner.scanForFall();
    }, 5*60*1e3);
  }*/
  onStartClick() {
   if (this.scanner.scanInterval) this.scanner.stop();
     else this.scanner.start();
  }

  onDeleteClick() {
    if (confirm('Delete All')) {
      this.scanner.deleteNotifications()
    }
  }
}
