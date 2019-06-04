import {Component, OnInit} from '@angular/core';
import {StorageService} from '../../a-core/services/app-storage.service';
import {NotesHistoryComponent} from '../notes-history/notes-history.component';
import {FollowOrdersService} from '../../a-core/apis/open-orders/follow-orders.service';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';
import * as  moment from 'moment';
import {map} from 'rxjs/operators';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';
import {noop} from 'rxjs/internal-compatibility';
import {CandlesService} from '../../a-core/app-services/candles/candles.service';
import {CandlesAnalys1} from '../../a-core/app-services/scanner/candles-analys1';
import {VOCandle} from '../../amodels/api-models';
import {MACD} from '../libs/techind';
import {MACDOutput} from '../libs/techind/moving_averages/MACD';
import {Observable} from 'rxjs/internal/Observable';
import {BotBase} from '../../app-bots/bot-base';


@Component({
  selector: 'app-order-reports',
  templateUrl: './order-reports.component.html',
  styleUrls: ['./order-reports.component.css']
})
export class OrderReportsComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storage: StorageService,
    private followOrder: FollowOrdersService,
    private candlesService: CandlesService
  ) {
  }

  ordersRecords: any[];
  ordersData: any[];
  selectedKey: string;

  macd1: MACDOutput[];
  macd2: MACDOutput[];

  macd1$: Observable<MACDOutput[]>;
  macd2$: Observable<MACDOutput[]>;

  market: string;
  exchange: string;
  dataName = '-logs';
  subBot;
  currentBot: BotBase;
  isLive: boolean;
  ngOnInit() {

    this.subBot = this.followOrder.botsSub.asObservable().pipe(
      map(bots => {
        this.ordersRecords = bots.map(function (item) {
          return {
            exchange: item.exchange,
            market: item.market,
           // reason: item.reason,
            x: 'X'
          };
        });
        return bots;
      })
    );

    combineLatest(this.subBot, this.route.params).pipe(map((args) => {
      const bots = args[0];
      const params = args[1];
      this.market = params.market;
      this.exchange = params.exchange;
      if (this.market === 'null' || this.market === 'undefined') this.market = null;
      if (this.exchange === 'null' || this.exchange === 'undefined') this.exchange = null;
      // @ts-ignore
      this.currentBot = _.find(bots, {market: this.market});
      this.showBot()
    })).subscribe(noop);
  }

  showBot() {
    this.showBotHistory();

  }

  onDeleteUSDTRecordsClick() {
    if (confirm('DELETE USDT_BTC ?')) {
      this.storage.remove('USDT_BTC-alerts').then(() => {
        this.onUsdtBtcClick();
      })
    }
  }


  onIsLiveChange(evt) {
   //  this.currentBot.isLive = this.isLive;
    const bots = this.followOrder.botsSub.getValue();
    this.followOrder.saveBots(bots)
  }

  async onUsdtBtcClick() {
    this.ordersData = await this.storage.select('USDT_BTC-alerts');
  }

  onBuyClick() {
    const bot = this.currentBot;
    if (!bot) return;
   /* bot.buyCoinInstant().then(res => {
      this.showBotHistory();
    })*/
  }

  onSellClick() {
    const bot = this.currentBot;
    if (!bot) return;
    // const reason = prompt('Reason');
   /* bot.sellCoinInstant(0).then(res => {
      this.showBotHistory();
    })*/
  }


  ////////////////////////////////////// BOTS


  /*onBotsChange(evt) {
    if(evt.checked) this.populateBots();
    else this.bots = null;
  }
*/

  onRecordsClick(evt) {
    const market = evt.item.market;
    const exchange = evt.item.exchange;
    switch (evt.prop) {
      case 'market':
        if (this.market === market) {
          this.market = null;
          setTimeout(() => {
            this.market = market;
            this.showBotHistory();
          }, 1000)

        }
        else this.router.navigate(['trader/order-reports', {market, exchange}], {replaceUrl: true});
        return;
      case 'x':
        if (confirm(' DELETE ' + market)) {
          this.followOrder.deleteBot(market)
        }
        return;
    }
  }


  candles: VOCandle[];
  onCandles(candles: VOCandle[]) {
    this.candles = candles;
    //console.log(candles);
   /* const closes = CandlesAnalys1.closes(candles);

    this.closes = CandlesAnalys1.from15mTo1h(closes);
   // console.log(this.closes);

    const macdInput:any = {
      values: this.closes,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: true,
      SimpleMASignal: false
    };

    const values = (new MACD(macdInput)).getResult();
    //console.log(values);*/

  }

  volumes: number[];
  closes: number[];

  async showBotHistory() {
    const bot = this.currentBot;
    if (!bot) {
      this.ordersData = null;
      return;
    }

    /*if(this.currentBot.macdSignal){
      this.macd1$ = this.currentBot.macdSignal.macd15m$;
      this.macd2$ = this.currentBot.macdSignal.macd30m$;
    }*/



   /* this.currentBot.macdSignal.macd15m$.subscribe(res=>{
      this.macd1 = res;
    });
    this.currentBot.macdSignal.macd1h$.subscribe(res=>{
      this.macd2 = res;
    });*/
    /* const market = this.currentBot.market;
     const closes = this.candlesService.closes(market);

     this.closes = CandlesAnalys1.from15mTo1h(closes);
     console.log(this.closes);*/

    // this.volumes = volumes;


    switch (this.dataName) {
      case '-patterns':
       /* this.ordersData = bot.getPatterns().map(function (item) {
          return {
            date: moment(item.stamp).format('DD HH:mm'),
            v3_med: item.v3_med,
            ma3_25: item.ma3_25,
            ma7_99: item.ma7_99
          }
        });*/
        break;
      default:
        bot.getLogs().then(logs => {
          this.ordersData = logs;
        });
        break;
    }
  }

  onDataChange(evt) {
    this.dataName = evt.value;
    this.showBotHistory();
  }

  ///////////////////////////////////////////////////
  async onDeleteRecordsClick() {
    const bots = await this.followOrder.getBots();
    const exist = true// _.find(bots, {market: this.market});
    if (!exist) return;
    if (confirm('Delete  history ' + this.market + '?')) {
      //await exist.deleteHistory();
      // this.showBotHistory();
    }
  }

  onOrdersDataClick(evt) {
    console.log(evt);
  }

  /* onOrdersRecordsClick(evt){
     console.log(evt)
     switch (evt.prop) {
       case 'key':
         this.selectedKey = evt.item.key;
         this.storage.select(this.selectedKey).then(results =>{
         //  console.log(results);

          if(Array.isArray(results))
           this.ordersData = results.map(function (item) {
             return {
               record:item,
             }
           });
          else this.ordersData = [results]
         });

         return
     }

   }*/

}
