import {Component, OnDestroy, OnInit} from '@angular/core';
import {VOMarketCap, VOWatchdog} from '../../models/app-models';
import {WatchDogService} from '../watch-dog.service';
import {AuthHttpService} from '../../services/auth-http.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MarketCapService} from '../../market-cap/services/market-cap.service';
import {StorageService} from '../../services/app-storage.service';
import * as moment from 'moment';
import * as _ from 'lodash';
import {AppBuySellService} from '../../app-services/app-buy-sell-services/app-buy-sell.service';

@Component({
  selector: 'app-watchdogs-list',
  templateUrl: './watchdogs-list.component.html',
  styleUrls: ['./watchdogs-list.component.css']
})
export class WatchdogsListComponent implements OnInit, OnDestroy {

  action: string
  watchDogs: VOWatchdog[];
  MC: { [symbol: string]: VOMarketCap };

  isBotsRunning: boolean;

  constructor(
    //  private watchdogService:WatchDogService,
    private auth: AuthHttpService,
    private markrtCap: MarketCapService,
    private router: Router,
    private route: ActivatedRoute,
    private wdService: AppBuySellService
  ) {
  }


  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params.action) {
        this.action = params.action.toUpperCase();
        if (this.action === 'SELL') {
          this.initSellBots();
        }
      }

    });
  }

  initSellBots() {
    this.wdService.isSellRunning$().subscribe(isRunning => {

      this.isBotsRunning = isRunning;
    });
    this.wdService.subSellCoins$().subscribe(wds => {
      this.watchDogs = wds;
    })
  }


  ngOnDestroy() {
    // this.sub1.unsubscribe();
  }

  mapMC() {
    if (this.MC && this.watchDogs) {
      this.watchDogs.forEach(function (item) {
        item.mc = this.MC[item.coin];
      }, {MC: this.MC})
    }
  }

  onNewClick() {
    this.router.navigateByUrl('/email-service/watchdog-edit/' + moment().toISOString());

  }

  async onDeleteClick(dog: VOWatchdog) {
    console.log(dog);
    if (!confirm('You want to delete Watchdog ' + dog.name + '?')) return;
    this.wdService.deleteWatchDog(dog);
  }

  onNameClick(dog: VOWatchdog) {
    this.router.navigateByUrl('/email-service/watchdog-edit/' + dog.id)
  }

  startStopBots() {
    if (!this.isBotsRunning) {
      if (this.action === 'SELL') this.wdService.startSellBots();
    } else {
      if (this.action === 'SELL') this.wdService.stopSellBots();
    }

  }

}
