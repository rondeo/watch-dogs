import {Component, OnDestroy, OnInit} from '@angular/core';
import {OrderType, VOMarketCap, VOWatchdog} from '../../amodels/app-models';
import {WatchDogService} from '../watch-dog.service';
import {AuthHttpService} from '../../a-core/services/auth-http.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MarketCapService} from '../../market-cap/services/market-cap.service';
import {StorageService} from '../../a-core/services/app-storage.service';
import * as moment from 'moment';
import * as _ from 'lodash';
import {AppBotsService} from '../../a-core/app-services/app-bots-services/app-bots.service';
import {WatchDog} from '../../amodels/watch-dog';


@Component({
  selector: 'app-watchdogs-list',
  templateUrl: './watchdogs-list.component.html',
  styleUrls: ['./watchdogs-list.component.css']
})
export class WatchdogsListComponent implements OnInit, OnDestroy {

  orderType: string;
  watchDogs: WatchDog[];
  MC: { [symbol: string]: VOMarketCap };

  isBotsRunning: boolean;

  constructor(
    //  private watchdogService:WatchDogService,
    private auth: AuthHttpService,
    private markrtCap: MarketCapService,
    private router: Router,
    private route: ActivatedRoute,
    private botsService: AppBotsService
  ) {
  }


  dryRunDogs() {
    this.botsService.dryRun(this.orderType);
  }
  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params.orderType) {
        this.orderType = params.orderType.toUpperCase();
        if (this.orderType === 'SELL') {
          this.initSellBots();
        }
      }

    });
  }

  initSellBots() {
    this.botsService.isSellRunning$().subscribe(isRunning => {
      this.isBotsRunning = isRunning;
    });

    this.botsService.allWatchDogs$().subscribe(wds => {
      this.watchDogs = wds.filter(function (item) {
        return item.orderType === OrderType.SELL;
      });
    });
  }


  ngOnDestroy() {
    // this.sub1.unsubscribe();
  }

  mapMC() {
   /* if (this.MC && this.watchDogs) {
      this.watchDogs.forEach(function (item) {
        //item.mc = this.MC[item.coin];
      }, {MC: this.MC})
    }*/
  }

  onNewClick() {
    this.router.navigateByUrl('/email-service/watchdog-edit/' + moment().toISOString());

  }

  async onDeleteClick(dog: WatchDog) {
    console.log(dog);
    if (!confirm('You want to delete Watchdog ' + dog.name + '?')) return;
    this.botsService.deleteWatchDogById(dog.id);
  }

  onEditClick(dog: WatchDog) {
    this.router.navigateByUrl('/email-service/watchdog-edit/' + dog.id);
  }

  startStopBots() {
    if (!this.isBotsRunning) {
      if (this.orderType === 'SELL') this.botsService.startSellBots();
    } else {
      if (this.orderType === 'SELL') this.botsService.stopSellBots();
    }

  }

  isActiveClick(dog: WatchDog) {
    dog.isActive = !dog.isActive;
    this.botsService.save();
  }
}
