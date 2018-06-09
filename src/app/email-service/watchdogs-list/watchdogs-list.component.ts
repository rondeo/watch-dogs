import {Component, OnDestroy, OnInit} from '@angular/core';
import {VOMarketCap, VOWatchdog} from '../../models/app-models';
import {WatchDogService} from '../watch-dog.service';
import {AuthHttpService} from '../../services/auth-http.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MarketCapService} from '../../market-cap/services/market-cap.service';
import {StorageService} from '../../services/app-storage.service';
import * as moment from 'moment';
import * as _ from 'lodash';
import {AppBotsService} from '../../app-services/app-bots-services/app-bots.service';
import {WatchDog} from '../../models/watch-dog';


@Component({
  selector: 'app-watchdogs-list',
  templateUrl: './watchdogs-list.component.html',
  styleUrls: ['./watchdogs-list.component.css']
})
export class WatchdogsListComponent implements OnInit, OnDestroy {

  action: string
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


  dryRunDogs(){
    this.botsService.dryRun(this.action);
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
    this.botsService.isSellRunning$().subscribe(isRunning => {
      this.isBotsRunning = isRunning;
    });

    this.botsService.subSellCoins$().subscribe(wds => {
      this.watchDogs = wds.map(function (item) {
        return new WatchDog(item);
      });
    })
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
    this.botsService.deleteWatchDog(dog);
  }

  onNameClick(dog: WatchDog) {
    this.router.navigateByUrl('/email-service/watchdog-edit/' + dog.id)
  }

  startStopBots() {
    if (!this.isBotsRunning) {
      if (this.action === 'SELL') this.botsService.startSellBots();
    } else {
      if (this.action === 'SELL') this.botsService.stopSellBots();
    }

  }

}
