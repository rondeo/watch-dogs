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
import {AppBotsService} from '../../app-services/app-bots-services/app-bots.service';
import {CandlesService} from '../../app-services/candles/candles.service';
import {FollowOrdersService} from '../../apis/open-orders/follow-orders.service';

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

  MC: VOMCObj;
  notifications: any[];
  notifications2: any[];
  coinsAvailable: VOMarketCap[];
  candlesInterval = '15m';
  scannerSatatsSub: Subject<string> = new Subject();
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
    public scanner: ScanMarketsService,
    private candlesService: CandlesService,
    private cryptoCompare: ApiCryptoCompareService,
    private followOrder: FollowOrdersService
  ) {

  }


  onProgressClick() {
    this.showMarket(this.scanner.currentMarket);

  }


  //////////////////////////BOTS ///////////////////////

  bots: any[];
  onBotsChange(evt) {
    if(evt.checked) this.populateBots();
    else this.bots = null
  }

  populateBots() {
    this.followOrder.getBots().then(res=>{
      if(!res) return;
      this.bots = res.map(function (item) {
        return{
          market: item.market,
          x:'X'
        }
      })
    })

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
            .then(this.populateBots.bind(this))
        }
        return;
      case 'message':
        this.dialog.open(NotesHistoryComponent, {data: evt.item});
        return

    }
  }

  ///////////////////////////////SELECTED////////////////////////////

  onDeleteSelectedClick() {
    if (confirm('Delete all Selected? ')) {
      this.scanner.saveSelected([]).then(this.populateSelected.bind(this));
    }
  }

  addToSeleted(ar: { time: string, message: string, market: string }[], criteria: string) {
    return this.scanner.addToSelected(ar, criteria);
  }

  selectedMarkets: any[];

  populateSelected() {
    this.scanner.getSelected().then(res => {
      res = _.orderBy(res, 'market');
      this.selectedMarkets = res.map(function (item) {
        return Object.assign(item, {x: 'X'});
      })
    })
  }

  onSelectedChange(evt) {
    if (evt.checked) this.populateSelected();
    else this.selectedMarkets = [];
  }

  onSelectedClick(evt) {
    const market = evt.item.market;
    switch (evt.prop) {
      case 'market':
        this.showMarket(market);
        return;
      case 'x':
        if (confirm(' DELETE ' + market)) {
          this.scanner.removeSelected(market)
            .then(this.populateSelected.bind(this))
        }
        return;
      case 'message':
        this.dialog.open(NotesHistoryComponent, {data: evt.item});
        return

    }
  }


  ////////////////////////////////////////////////// TREND UP ///////////////////////////////////////////////////////

  onTrendsAddToSelected() {
    const ar = this.trendUps.map(function (item) {
      return {
        market: item.market,
        message: item.message,
        time: item.time

      }
    })
    if (confirm(' ADD all ' + ar.length)) {
      this.addToSeleted(ar, this.trendUpCandlesInterval);
    }
  }

  trendUps: any[] = [];
  sub5;
  trendUpCandlesInterval = '15m';

  async onTrendUPStart() {
    if (this.scanner.trendUPTimer) {
      this.scanner.stopTrendUp();
      return;
    }
    const markets = await this.scanner.getAvailableMarkets('binance');
    this.trendUps = [];
    const sub = await this.scanner.scanGoingUP(markets, this.trendUpCandlesInterval);
    this.sub5 = sub.subscribe(market => {
      let item = Object.assign(market, {x: 'X'});
      this.trendUps.push(item);
    })
  }

  onTrendUPClick(evt) {
    const market = evt.item.market;
    if (evt.prop === 'market') this.showMarket(market);
    else if (evt.prop === 'x') {
      if (confirm(' DELETE ' + market)) {
        this.trendUps = _.reject(this.trendUps, {market: market});
      }
    }
  }


  /////////////////////////////////////////// END TREND UP //////////////////////////////////////////////////////


  ////////////////////////////////////////////// MFI START ///////////////////////////////////////

  mfiCandlesInterval = '1h';
  MFIResults;
  mfySub: Subscription;

  onMFIChange(evt) {
    if (evt.checked) {
      if (!this.mfySub) {
        this.mfySub = this.scanner.mfiSub.subscribe(this.setMFIs.bind(this))
        this.scanner.getMFIs();
      }

    } else this.volumesResults = null
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
            .then(this.setMFIs.bind(this))
        }
        return;
      case 'result':
        this.dialog.open(NotesHistoryComponent, {data: evt.item});
        return

    }

  }

  ////////////////////////////////////////////////// MFI END ///////////////////////////////////////////////

  //////////////////////////////////////////VOLUME START /////////////////////////////////////////////////

  scanOnlyUP = true;
  volumesResults: any[];

  volumeSub: Subscription;

  async onVolumeChange(evt) {
    if (evt.checked) {
      this.setVolumes(await this.scanner.getVolumes());

    } else this.volumesResults = null
  }


  async onVolumeStartClick() {
    if (!this.volumeSub) this.volumeSub = this.scanner.volumeResults$().subscribe(results => {

      if (!Array.isArray(results)) return;
      this.volumesResults = results.map(function (item) {
        return Object.assign(item, {x: 'X'})
      });
    });

    if (this.scanner.scanVolumeTimer) {
      this.scanner.stopVolumeScan();
      return;
    }

    const markets = this.scanOnlyUP ?
      _.map(await this.scanner.getSelected(), 'market') : await this.scanner.getAvailableMarkets('binance');
    ;

    this.scanner.scanForVolume(markets)
    // console.log(markets);
    // const sub = await this.scanner.scanForVolume(markets);
    // sub.subscribe(this.setVolumes.bind(this));
  }

  setVolumes(results) {
    this.volumesResults = results.map(function (item) {
      return Object.assign(item, {x: 'X'});
    });
  }

  onDeleteVolumesClick() {
    if (confirm('Delete Volumes?')) {
      setTimeout(async () => {
        await this.scanner.deleteVolumes();
        this.setVolumes(await this.scanner.getVolumes());

      }, 500);
    }
  }

  onVolumeClick(evt) {
    const market = evt.item.market;
    switch (evt.prop) {
      case 'market':
        this.showMarket(market);
        return;
      case 'x':
        if (confirm(' DELETE ' + market)) {
          this.scanner.deleteVolume(market)
            .then(this.setVolumes.bind(this))
        }
        return;
      case 'result':
        this.dialog.open(NotesHistoryComponent, {data: evt.item});
        return

    }

  }

  /////////////////////////////////////////VOLUME END ///////////////////////////////////////////////////////


  userMarket: string;

  onMarketInput(evt) {
    if (evt.code === 'Enter') this.showCandles(this.userMarket);
    //  console.log(evt, this.userMarket);
  }

  onCandlesIntrvalChange() {
    this.showCandles(this.userMarket);
  }

  sub1: Subscription;
  sub2: Subscription;
  sub3: Subscription;

  async ngOnInit() {
    this.initAsync();
    //  this.botsService.init();
  }


  /////////////////////////////////////////// FAVORITES START //////////////////////////////////////////////
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
  favoriteSub: Subscription;

  onFavoriteChange(evt) {
    if (evt.checked) {
      this.scanner.favorites$().then(sub => {
        this.favoriteSub = sub.subscribe(data => {
          this.favorites = data.map(function (o) {
            return {
              stamp: moment(o.stamp).format('DD HH:mm'),
              market: o.market,
              message: o.message,
              x: 'X'
            }
          });
        })
      })
    } else {
      this.favoriteSub.unsubscribe();
      this.favorites = null;
    }
  }

  ///////////////////////////////// FAVORITE END /////////////////////////////////////////////////////


  ///////////////////////////////Following//////////////////////////

  following: any[];

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
              })
            })
          })
          // console.log(keys);

        }
        break;
    }

  }


  private async populateFollowing() {
    const keys: string[] = await this.storage.keys()
    // console.log(keys);
    const key = 'follow-order-log';
    const orders = keys.filter(function (item) {
      return item.indexOf(key) !== -1
    })

    this.following = orders.map(function (item) {
      return {
        market: item.substr(key.length),
        x: 'X'
      }
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

  // analizeMarket: string;
  // analizeTime: string;
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


  candles: VOCandle[];
  volumes: number[];

  /*onDatasetClick(obj) {
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
    /!* if (prop === 'LH') {
       this.router.navigateByUrl('my-exchange/buy-sell/' + this.exchange + '/' + market);
     }*!/
    if (prop === 'market') {
      this.showMarket(market);
    }else if(prop === 'result') {
      this.dialog.open( NotesHistoryComponent,{data:item} )
    }

  }*/

  mediaFrom: string;
  mediaTo: string;

  twitterPoints: string;
  redditPoints: string;
  facebookPoints: string;

  inBrowser: boolean;

  showMedia(market: string) {
    this.cryptoCompare.getSocialStats(market.split('_')[1]).then(res => {
      if(!res){
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

    })
  }

  showMarket(market: string) {
    this.userMarket = market;
    this.selectedMarket = market;
    this.showCandles(market);
    if (this.inBrowser) this.openMarket(this.exchange, market);
    this.showMedia(market);


  }

  async showCandles(market: string) {
    this.selectedMarket = market;
    let candles = await this.apisPublic.getExchangeApi(this.exchange).downloadCandles(market, this.candlesInterval, 200);
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
    const url = 'https://www.binance.com/en/trade/pro/' + market.split('_').reverse().join('_');//   api.getMarketUrl(ar[0], ar[1]);
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
