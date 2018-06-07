import {Component, OnInit} from '@angular/core';
import {MatSnackBar} from '@angular/material';
import {AppBuySellService} from '../../app-services/app-buy-sell-services/app-buy-sell.service';
import {StorageService} from '../../services/app-storage.service';
import {WatchDogService} from '../watch-dog.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ActivatedRoute} from '@angular/router';
import {VOWatchdog} from '../../models/app-models';
import {VOMCAgregated} from '../../apis/models';


@Component({
  selector: 'app-watchdog-test',
  templateUrl: './watchdog-test.component.html',
  styleUrls: ['./watchdog-test.component.css']
})
export class WatchdogTestComponent implements OnInit {

  private uid: string;
  private watchDog: VOWatchdog = new VOWatchdog({});
  MC: VOMCAgregated;
  scripts:string[];
  // scriptText: string;
  constructor(
    private route: ActivatedRoute,
    private watchdogService: WatchDogService,
    private storage: StorageService,
    private marketCap: ApiMarketCapService,
    private snackBar: MatSnackBar,
    private buySellCoin: AppBuySellService
  ) {
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.uid = params.uid;
      this.initAsync();
    })
  }

  async initAsync() {
    if(!this.uid) throw new Error(' no id ');
    this.watchDog =  await this.buySellCoin.getWatchDogById(this.uid);
    if(!this.watchDog) throw new Error(' no WD for ' + this.uid);
    this.scripts = this.watchDog.sellScripts;
    console.log(this.watchDog);
   //  this.scriptText = this.scripts.join('<br>');


  }

  async onRunClick() {
    if(!this.MC) this.MC = await this.marketCap.getCoin(this.watchDog.coin);
    console.log(this.MC)


    console.log('run');
  }

}
