import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiMarketCapService} from '../../a-core/apis/api-market-cap.service';
import {ApisPublicService} from '../../a-core/apis/api-public/apis-public.service';
import {VOMarketCap} from '../../amodels/app-models';
import {VOCandle, VOMCObj} from '../../amodels/api-models';
import {MATH} from '../../acom/math';
import * as _ from 'lodash';
import {MatDialog, MatSnackBar} from '@angular/material';
import * as moment from 'moment';
import {StorageService} from '../../a-core/services/app-storage.service';
import {Router} from '@angular/router';
import {ScanMarketsService} from '../../a-core/app-services/scanner/scan-markets.service';
import {CandlesAnalys1} from '../../a-core/app-services/scanner/candles-analys1';

import {CandlesAnalys2} from '../../a-core/app-services/scanner/candles-analys2';
import {ApiCryptoCompareService} from '../../a-core/apis/api-crypto-compare.service';
import {NotesHistoryComponent} from '../notes-history/notes-history.component';
import {AppBotsService} from '../../a-core/app-services/app-bots-services/app-bots.service';
import {CandlesService} from '../../a-core/app-services/candles/candles.service';
import {FollowOrdersService} from '../../a-core/apis/open-orders/follow-orders.service';
import {Subject, Subscription} from 'rxjs';
import {Observable} from 'rxjs/internal/Observable';
import {catchError, filter, finalize, map} from 'rxjs/operators';
import {FavoritesService} from '../../a-core/app-services/favorites.service';
import {MACDOutput} from '../libs/techind/moving_averages/MACD';
import {VOGraphs} from '../../aui/comps/line-chart/line-chart.component';
import {of} from 'rxjs/internal/observable/of';
import {fromPromise} from 'rxjs/internal-compatibility';
import {MyPatternService} from '../../app-scanners/my-pattern.service';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';

@Component({
  selector: 'app-scan-markets',
  templateUrl: './scan-markets.component.html',
  styleUrls: ['./scan-markets.component.css']
})
export class ScanMarketsComponent implements OnInit, OnDestroy {

  constructor(
    private marketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService,
    private apiCryptoCompare: ApiCryptoCompareService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private storage: StorageService,
    private router: Router,
    public scanner: ScanMarketsService,
    private candlesService: CandlesService,
    private cryptoCompare: ApiCryptoCompareService,
    private followOrder: FollowOrdersService,
    private favorites: FavoritesService,
    private myPatternService: MyPatternService
  ) {

  }

  isScanning$: BehaviorSubject<boolean>;
  textInput: string;
  coin: string;
  exchange = 'binance';
  // market: string;
  currentData: any[];

  MC: VOMCObj;
  notifications: any[];
  notifications2: any[];
  coinsAvailable: VOMarketCap[];
  candlesInterval = '15m';
  scannerSatatsSub: Subject<string> = new Subject();
  // private selectedCoin: string;
  selectedMarket: string;
  dataset$: Observable<any[]>;
  maX: string;
  percent: number;

  closes: number[];
  ////////////////////////// BOTS ///////////////////////

  bots: any[];
  stochMarket: string;
  macdMarket: string
  sub5;

  candles: VOCandle[];


  async ngOnInit() {

    //  this.botsService.init();
  }



  startMyScan() {
    this.isScanning$ = this.myPatternService.isScanning$;
    this.myPatternService.startScan().then(sub => {
      if(!sub) return;
      console.log('%c ' + moment().format('HH:mm') + ' start scan', 'color:red');
      sub.subscribe(data => {
        this.stochMarket = null;
        this.macdMarket = null;
        this.market = data;
        // this.candles = candles.candles;
        // this.closes = CandlesAnalys1.closes(data.candles);
      }, err => {

      }, () => {
       //  setTimeout(() => this.startMyScan(), 20 * 60 * 1000)
      })
    })
  }

  onBuySellResults(evt){
    console.warn(evt);
    if(evt.checked){
      this.scanResults$ = fromPromise(this.scanner.buySellResults());
    } else this.scanResults$ = this.scanner.scanResults$;


  }
  /////////////////////////////////////////// END TREND UP //////////////////////////////////////////////////////

  myGraphs: VOGraphs;
  myTitle: string;
  area: number[];




  //////////////////////////////// Pattern ///////////////////////////////////////////

  patterns: any[];

  onPatternClick(evt) {
    const market = evt.item.market;
    // console.log(evt.item);
    switch (evt.prop) {
      case 'market':
        this.showMarket(market);
        return;
      case 'x':
        if (confirm(' DELETE ' + market)) {

        }
        return;
      case 'message':

        return;

    }

  }


  onPatternChange(evt) {

  }


  scanResults$: Observable<any[]>;
  volumeDifference = 50;

  timeout;

  async onPatternStartClick() {
    const mapFunction = function (items) {
      return items.map(function (item) {
        return Object.assign(item, {x: 'X'});
      })
    };

    if (this.scanner.scanningSub.getValue()) {
      // this.scanner.stop();
      this.scanner.autoScanStop();
      return;
    }

    this.scanner.autoScanStart();

    /*  console.log('%c SCAN STARTED ', 'color:pink');
      this.snackBar.open('SCAN START', 'x', {duration: 3000});
      const markets = await this.scanner.getAvailableMarkets('binance');
      this.scanResults$ = this.scanner.scanPatterns(markets, this.candlesInterval, +this.volumeDifference).asObservable()
        .pipe(
          map(mapFunction),
          catchError(err => {
            console.log(err);
            return of([]);
          }),
          finalize(() => {
           //  this.timeout = setTimeout(() => this.onPatternStartClick(), 10 * 60000);
            this.snackBar.open('SCAN COMPLETE', 'x', {duration: 10000});
            console.log('%c SCAN COMPLETE new scan in 10 min', 'color:pink');
            return null;
          }));*/


  }

  //////////////////////////////////////////////////


  market: string;

  sub1: Subscription;
  sub2: Subscription;
  sub3: Subscription;


  /////////////////////////////// Following//////////////////////////

  following: any[];

  volumes: number[];

  mediaFrom: string;
  mediaTo: string;

  twitterPoints: string;
  redditPoints: string;
  facebookPoints: string;

  inBrowser: boolean;


  onProgressClick() {
    this.showMarket(this.scanner.currentMarket);

  }

  onBotsChange(evt) {
    if (evt.checked) this.populateBots();
    else this.bots = null;
  }

  populateBots() {
    this.followOrder.getBots().then(res => {
      if (!res) return;
      this.bots = res.map(function (item) {
        return {
          market: item.market,
          x: 'X'
        };
      });
    });

  }

  onBotsClick(evt) {
    const market = evt.item.market;
    switch (evt.prop) {
      case 'market':
        this.showMarket(market);
        return;
      case 'x':
        if (confirm(' DELETE ' + market)) {
          this.followOrder.deleteBot(market)
            .then(this.populateBots.bind(this));
        }
        return;
      case 'message':
        this.dialog.open(NotesHistoryComponent, {data: evt.item});
        return;

    }
  }




  onMarketInput(evt) {
    if (evt.code === 'Enter') this.showCandles(this.market);
    //  console.log(evt, this.market);
  }

  onCandlesIntrvalChange() {
    this.showCandles(this.market);
  }




  /////////////////////////////////////////// FAVORITES START //////////////////////////////////////////////

  onFavoriteChange(evt) {
    if (evt.checked) {
      this.dataset$ = this.favorites.data$().pipe(filter(res => !!res), map(res => {
        return res.map(item => Object.assign(item, {x:'X'}));
      }))
    }
  }


  onFavoritesClick(obj) {
    //   console.log(obj);
    const item = obj.item;
    const prop = obj.prop;
    const market = item.market;
    const ar = market.split('_');
    if (prop === 'x') {
      if (confirm('remove from favorites ' + market + '?')) this.favorites.delete(market);
    }
    if (prop === 'market') this.showMarket(market);

  }


  onFollowingClick(evt) {
    const item = evt.item;
    const prop = evt.prop;
    const market = item.market;
    //  console.log(evt);
    switch (prop) {
      case 'market':
        this.showMarket(market);
        break;
      case 'x':
        if (confirm('Remove ' + market + '?')) {
          this.storage.keys().then(keys => {
            this.storage.remove('follow-order-log' + market).then(() => {
              this.storage.remove('init-orderbinance' + market).then(() => {
                this.populateFollowing();
              });
            });
          });
          // console.log(keys);

        }
        break;
    }

  }


  private async populateFollowing() {
    const keys: string[] = await this.storage.keys();
    // console.log(keys);
    const key = 'follow-order-log';
    const orders = keys.filter(function (item) {
      return item.indexOf(key) !== -1;
    });

    this.following = orders.map(function (item) {
      return {
        market: item.substr(key.length),
        x: 'X'
      };
    });
  }

  async onFollowingChange(evt) {

    if (evt.checked) {
      this.populateFollowing();
    } else {
      this.following = [];
    }

  }

  //////////////////////////////////////////

  /*
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
    }*/


  ngOnDestroy() {
    this.unsubscribe();
    clearTimeout(this.timeout);
  }

  unsubscribe() {
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.sub2.unsubscribe();
    if (this.sub3) this.sub3.unsubscribe();
  }

  showMedia(market: string) {
    this.cryptoCompare.getSocialStats(market.split('_')[1]).then(res => {
      if (!res) {
        this.mediaFrom = '';
        this.mediaTo = '';
        this.twitterPoints = '';
        this.redditPoints = '';
        this.facebookPoints = '';
        return;
      }
      this.mediaFrom = res.timeFrom;
      this.mediaTo = res.timeTo;
      this.twitterPoints = res.TwPoints;
      this.redditPoints = res.RdPoints;
      this.facebookPoints = res.FbPoints;

    });
  }


  showMarket(market: string) {
    this.market = market;
    this.coin = market.split('_')[1];
    this.selectedMarket = market;
    this.showCandles(market);
    if (this.inBrowser) this.openMarket(this.exchange, market);
    this.showMedia(market);


  }

  async showCandles(market: string) {
    this.selectedMarket = market;
    const api = this.apisPublic.getExchangeApi('binance');

    let candles = await api.downloadCandles(market, this.candlesInterval, 200);
    if (!candles) {
      this.candles = null;
      this.volumes = null;
      return;
    }

    this.scanner.currentMarket = market;

    this.candles = candles;
    this.volumes = candles.map(function (o) {
      return o.open > o.close ? -o.Volume : o.Volume;
    });
  }

  openMarket(exchange: string, market: string) {
    const api = this.apisPublic.getExchangeApi(exchange);
    const ar = market.split('_');
    const url = 'https://www.binance.com/en/trade/pro/' + market.split('_').reverse().join('_'); //   api.getMarketUrl(ar[0], ar[1]);
    window.open(url, exchange);
  }

  onAddClick() {
    const market = this.textInput;
    console.log(market);
    if(!market || market.length < 5) return;
    this.favorites.addMarket(market);
  }

  onStochRSI($event: { stochRSI: number; k: number; d: number }[]) {

   const last = _.last($event);
   if(last.k < 20) {
      this.stochMarket = ' stoch ' + last.k +' '  + last.d
     if(this.macdMarket) console.log(this.market + this.stochMarket + this.macdMarket)
   }
  }

  onMACD(data: MACDOutput[]) {
    const last: MACDOutput = _.last(data);
    const prelast: MACDOutput = data[data.length -2];
    if(last.histogram > prelast.histogram && last.MACD < 0) {
      this.macdMarket =  ' MACD  ' + last.histogram  + '   ' + prelast.histogram  + ' ' + last.MACD;
      if(this.stochMarket) console.log(this.market + this.stochMarket + this.macdMarket)
    }
  }
  onStartClick() {
    this.startMyScan();
  }

  onStopClick() {
    this.myPatternService.stopScan();
  }

  onCandles(candles: VOCandle[]) {
    this.closes = CandlesAnalys1.closes(candles);
  }
}
