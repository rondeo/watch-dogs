import {Component, OnInit} from '@angular/core';
import {OrderType, VOMarketCap, VOWATCHDOG, VOWatchdog} from '../../amodels/app-models';
import {ActivatedRoute} from '@angular/router';
import {WatchDogService} from '../watch-dog.service';
import {StorageService} from '../../adal/services/app-storage.service';
import {MarketCapService} from '../../market-cap/services/market-cap.service';
import {MatSnackBar} from '@angular/material';
import * as moment from 'moment';
import * as _ from 'lodash';
import {ApiMarketCapService} from '../../adal/apis/api-market-cap.service';
import {AppBotsService} from '../../adal/app-services/app-bots-services/app-bots.service';
import {WatchDog} from '../../amodels/watch-dog';


@Component({
  selector: 'app-watchdog-edit',
  templateUrl: './watchdog-edit.component.html',
  styleUrls: ['./watchdog-edit.component.css']
})
export class WatchdogEditComponent implements OnInit {

  watchDog: WatchDog = new WatchDog(VOWATCHDOG);

  reports: string;
  bases: string[] = ['BTC', 'USDT', 'ETH'];
  exchanges: string[] = ['binance', 'bittrex', 'poloniex'];
  selectedCoins: string[];
  MC: { [symbol: string]: VOMarketCap };
  coinMC: VOMarketCap = new VOMarketCap();

  constructor(
    private route: ActivatedRoute,
    private watchdogService: WatchDogService,
    private storage: StorageService,
    private marketCap: ApiMarketCapService,
    private snackBar: MatSnackBar,
    private botsService: AppBotsService
  ) {
  }

  ngOnInit() {

    this.initAsync();
  }

  async initAsync() {
    this.selectedCoins = await this.storage.getSelectedMC();
    let id = this.route.snapshot.paramMap.get('uid');

    let wd = await this.botsService.getWatchDogById(id);

    if (!wd) {
      wd = new WatchDog(VOWATCHDOG);
      // wd.id = id;
      wd.orderType = OrderType.SELL;
    }
   // if(!wd.sellScripts) wd.sellScripts = [];
   // if(!wd.buyScripts) wd.buyScripts = [];
    this.watchDog = wd;
  }

  async displayMC() {
    const MC = await this.marketCap.downloadTicker().toPromise();
    console.log(MC);
    let coin = this.watchDog.coin;
    if (!coin) return;

    console.log(MC[coin]);
   // this.mcCoin = MC[coin];
  }

  onCoinChange(evt) {
    let coin = this.watchDog.coin;
    this.displayMC();
  }

  saveWatchdog() {

    if (!this.watchDog.base || this.watchDog.base.length < 2) {

      this.snackBar.open('Select base ', 'x', {duration: 3000});
      return;
    }
    if (!this.watchDog.coin || this.watchDog.coin.length < 2) {
      this.snackBar.open('Select coin', 'x', {duration: 3000});
      return;
    }
    if (!this.watchDog.exchange || this.watchDog.exchange.length < 2) {
      this.snackBar.open('Select Exchange', 'x', {duration: 3000});
      return;
    }
    /*if (!this.watchDog.amount) {
      this.snackBar.open('Set amount', 'x', {duration: 3000});
      return
    }*/
    // if (!this.watchDog.name) this.watchDog.name = this.watchDog.exchange + ' ' + this.watchDog.base + ' ' + this.watchDog.coin
    // + ' ' + this.watchDog.amount;
   // const sellScript = this.watchDog.sellScripts?this.watchDog.sellScripts.toString():null;
   // const buyScript = this.watchDog.buyScripts?this.watchDog.buyScripts.toString():null;
    // console.log(!sellScripts, !buyScripts);
   /* if(this.watchDog.isActive && !sellScript && !buyScript){
      this.snackBar.open('Set Script', 'x', {panelClass:'alert-red'});
      return
    }*/

    this.saveWatchDog();
  }

  async saveWatchDog() {
    try {
      await this.botsService.saveWatchDog(this.watchDog);
      this.snackBar.open(this.watchDog.name + ' Saved ', 'x', {duration: 2000});
    } catch (e) {
      this.snackBar.open(e.toString(), 'x', {duration: 2000, panelClass: 'alert-red'});
    }
  }

  onClearReportClick() {
   /* if (confirm('Delete reports"')) {
      this.watchDog.results = [];
      this.reports = '';
    }*/

  }
}
