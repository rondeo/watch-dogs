import {Component, OnInit} from '@angular/core';
import {StorageService} from '../../services/app-storage.service';
import {NotesHistoryComponent} from '../notes-history/notes-history.component';
import {FollowOrdersService} from '../../apis/open-orders/follow-orders.service';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';
import * as  moment from 'moment';
import {MarketBot} from '../../app-services/app-bots-services/market-bot';
import {map} from 'rxjs/operators';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';
import {noop} from 'rxjs/internal-compatibility';
import {CandlesService} from '../../app-services/candles/candles.service';
import {CandlesAnalys1} from '../../app-services/scanner/candles-analys1';

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

  market: string;
  exchange: string;
  dataName = '-logs';

  subBot;

  currentBot: MarketBot;

  isLive: boolean;

  ngOnInit() {

    this.subBot = this.followOrder.botsSub.asObservable().pipe(
      map(bots => {
        this.ordersRecords = bots.map(function (item) {
          return {
            exchange: item.exchange,
            market: item.market,
            reason: item.reason,
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

  showBot(){
    this.isLive = this.currentBot ? this.currentBot.isLive : false;
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
    this.currentBot.isLive = this.isLive;
    const bots = this.followOrder.botsSub.getValue();
    this.followOrder.saveBots(bots)
  }

  async onUsdtBtcClick() {
    this.ordersData = await this.storage.select('USDT_BTC-alerts');
  }

  onBuyClick() {
    const bot = this.currentBot;
    if (!bot) return;
    bot.buyCoinInstant(0).then(res => {
      this.showBotHistory();
    })
  }

  onSellClick() {
    const bot = this.currentBot;
    if (!bot) return;
   // const reason = prompt('Reason');
    bot.sellCoinInstant(0).then(res => {
      this.showBotHistory();
    })
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
        if(this.market === market){
          this.market = null;
          setTimeout(()=>{
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

  volumes: number[];
  closes: number[];
  async showBotHistory() {
    const bot = this.currentBot;
    if (!bot) {
      this.ordersData = null;
      return;
    }
    const market = this.currentBot.market;
    const candles = this.candlesService.getCandles15min(market);
    // console.log(candles);
    const volumes = CandlesAnalys1.volumes(candles);
    const closes = CandlesAnalys1.closes(candles);
    this.volumes = volumes;
    this.closes = closes;

    switch (this.dataName) {
      case '-patterns':
        this.ordersData = bot.getPatterns().map(function (item) {
          return {
            date: moment(item.stamp).format('DD HH:mm'),
            v3_med: item.v3_med,
            ma3_25: item.ma3_25,
            ma7_99: item.ma7_99
          }
        });
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
    const exist = _.find(bots, {market: this.market});
    if (!exist) return;
    if (confirm('Delete  history ' + this.market + '?')) {
      await exist.deleteHistory();
      this.showBotHistory();
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
