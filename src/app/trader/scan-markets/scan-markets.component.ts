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

import {DialogInputComponent} from '../../material/dialog-input/dialog-input.component';
import {CandlesAnalys1} from '../../app-services/scanner/candles-analys1';

import {CandlesAnalys2} from '../../app-services/scanner/candles-analys2';
import {ApiCryptoCompareService} from '../../apis/api-crypto-compare.service';
import {NotesHistoryComponent} from '../notes-history/notes-history.component';
import {AppBotsService} from '../../app-services/app-bots-services/app-bots.service';
import {CandlesService} from '../../app-services/candles/candles.service';
import {FollowOrdersService} from '../../apis/open-orders/follow-orders.service';
import {Subject, Subscription} from 'rxjs';
import {Observable} from 'rxjs/internal/Observable';
import {map} from 'rxjs/operators';
import {FavoritesService} from '../../app-services/favorites.service';

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
    private favorites: FavoritesService
  ) {

  }

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

  ////////////////////////// BOTS ///////////////////////

  bots: any[];
  sub5;
  /////////////////////////////////////////// END TREND UP //////////////////////////////////////////////////////


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


  patterns$: Observable<any[]>;
  volumeDifference = 50;

  async onPatternStartClick() {

    if (this.scanner.isScanning) {
      this.scanner.stop();
    } else {
      const markets = await this.scanner.getAvailableMarkets('binance');
      this.patterns$ = this.scanner.scanPatterns(markets, this.candlesInterval, +this.volumeDifference).asObservable()
        .pipe(
          map(items => items.map(function (item) {
            return Object.assign(item, {x: 'X'});
          }))
        );
    }

  }

  //////////////////////////////////////////////////

  ////////////////////////////////////////////// MFI START ///////////////////////////////////////

  mfiCandlesInterval = '1h';
  MFIResults;
  mfySub: Subscription;

  ////////////////////////////////////////////////// MFI END ///////////////////////////////////////////////

  ////////////////////////////////////////// VOLUME START /////////////////////////////////////////////////

  scanOnlyUP = true;
  volumesResults$


  ///////////////////////////////////////// VOLUME END ///////////////////////////////////////////////////////


  userMarket: string;

  sub1: Subscription;
  sub2: Subscription;
  sub3: Subscription;


  /////////////////////////////// Following//////////////////////////

  following: any[];

  candles: VOCandle[];
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


  ////////////////////////////////////////////////// TREND  ///////////////////////////////////////////////////////

  async onScanStart() {
    if (this.scanner.isScanning) {
      this.scanner.stop();
      return;
    }
    const markets = await this.scanner.getAvailableMarkets('binance');
    this.dataset$ = this.scanner.startScan(markets, this.candlesInterval, this.maX, this.percent);
  }

  onMarketClick(evt) {
    const market = evt.item.market;
    if (evt.prop === 'market') this.showMarket(market);
    else if (evt.prop === 'x') {
    }
  }

  /////////////////////////////////
  onMFIChange(evt) {
    if (evt.checked) {
      if (!this.mfySub) {
        this.mfySub = this.scanner.mfiSub.subscribe(this.setMFIs.bind(this));
        this.scanner.getMFIs();
      }

    }
  }

  setMFIs(results: any[]) {
    if (!results) return;
    this.MFIResults = results.map(function (item) {
      return Object.assign(item, {x: 'X'});
    });
  }

  async onMFIStartClick() {
    if (this.scanner.scanMFITimer) {
      this.scanner.stopMFIScan();
      return;
    }

    const markets = this.scanOnlyUP ?
      _.map(await this.scanner.getSelected(), 'market') : await this.scanner.getAvailableMarkets('binance');
    // console.log(markets);
    this.scanner.scanForMFI(markets, this.mfiCandlesInterval);
  }

  onDeleteMFIsClick() {
    if (confirm('Delete Volumes?')) {
      this.scanner.deleteMFIs();
    }

  }

  onMFIClick(evt) {
    const market = evt.item.market;
    switch (evt.prop) {
      case 'market':
        this.showMarket(market);
        return;
      case 'x':
        if (confirm(' DELETE ' + market)) {
          this.scanner.deleteMFI(market)
            .then(this.setMFIs.bind(this));
        }
        return;
      case 'result':
        this.dialog.open(NotesHistoryComponent, {data: evt.item});
        return;

    }

  }

  async onVolumeChange(evt) {
  }

  async onVolumeStartClick() {
    const markets = await this.scanner.getAvailableMarkets('binance');
    this.volumesResults$ = this.scanner.scanForVolume(markets, this.candlesInterval, this.volumeDifference);
    // console.log(markets);
    // const sub = await this.scanner.scanForVolume(markets);
    // sub.subscribe(this.setVolumes.bind(this));
  }


  onVolumeClick(evt) {
    const market = evt.item.market;
    switch (evt.prop) {
      case 'market':
        this.showMarket(market);
        return;
      case 'result':
        this.dialog.open(NotesHistoryComponent, {data: evt.item});
        return;

    }

  }

  onMarketInput(evt) {
    if (evt.code === 'Enter') this.showCandles(this.userMarket);
    //  console.log(evt, this.userMarket);
  }

  onCandlesIntrvalChange() {
    this.showCandles(this.userMarket);
  }

  async ngOnInit() {
    this.initAsync();
    //  this.botsService.init();
  }


  /////////////////////////////////////////// FAVORITES START //////////////////////////////////////////////

  onFavoriteChange(evt) {
    if (evt.checked) {
      this.dataset$ = this.favorites.view$()
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

  async initAsync() {

    /* const sub = await this.scanner.notifications$();
     this.sub1 = sub.subscribe(notes => {
       this.notifications = _.filter(notes, 'a');
       this.notifications2 = _.reject(notes, 'a');
     });
     this.sub2 = this.scanner.currentResult$().subscribe(curr => {

       this.currentData = [curr];
     })*/
  }

  ngOnDestroy() {
    this.unsubscribe();
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
    this.userMarket = market;
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

  /*
    onClearMemoryClick() {
      if (confirm('Remove all data? ')) this.scanner.clearMemory(this.exchange)
        .then(res => {

          this.snackBar.open('Memory cleared', 'x', {duration: 3000});
        })

    }*/

  /* onDownClick(){
     this.scanner.scanGoingDown();
   }*/
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


  /* onStartClick() {
    if (this.scanner.scanInterval) this.scanner.stop();
      else this.scanner.start();
   }

   onDeleteClick() {
     if (confirm('Delete All')) {
       this.scanner.deleteNotifications()
     }
   }

   onDeleteTrendDownClick(){
     if(confirm('Empty trend down? ')) {
       this.scanner.emtyTrendDown();
     }

   }

   onTrendDownClick(evt){
     const market = evt.item;
     // console.log(evt);
     this.showMarket(market);
   }*/
}
