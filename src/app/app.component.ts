import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Http} from '@angular/http';
import {AuthHttpService, VOUser} from './a-core/services/auth-http.service';
import {MatDialog, MatSnackBar} from '@angular/material';
import {StorageService} from './a-core/services/app-storage.service';
import {MarketCapService} from './market-cap/services/market-cap.service';
import {AppBotsService} from './a-core/app-services/app-bots-services/app-bots.service';
import {FollowOrdersService} from './a-core/apis/open-orders/follow-orders.service';
import {Store} from '@ngrx/store';
import {AppState} from './a-core/reducers';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit {

  constructor(
    private auth: AuthHttpService,
    private storage: StorageService,
    private router: Router,
    private dialog: MatDialog,
    private botsService: AppBotsService,
    private snackBar: MatSnackBar,
    private followOrders: FollowOrdersService,
    private store: Store<AppState>
  ) {
  }
  title = 'app works!';
  menu: any;
  isLogedIn: boolean;
  nickname: string;
  countDown: number;
  historyCounter: number;

  sellCoinsCount: number;

  isMenu: boolean;

  bgColor = '';
  imageClass = '';


  onRefreshClick() {


  }

  onExchangeLogin() {


  }

  onLogout() {

  }

  onLoginClick() {

  }

  onClearStorage() {
    if (confirm('You want to delete all data from storage?')) {
      localStorage.clear();
    }
  }

  ngOnInit(): void {
    // this.store.subscribe()
    this.auth.isOnline$().subscribe(res => {
      this.imageClass = res ? '' : 'glow-red';
      this.bgColor = res ? '' : 'bg-red';
    });
    this.followOrders.initBots().then(() => {
      this.followOrders.follow('binance');
    });
  }

  onDogClick() {
    this.isMenu = !this.isMenu;
  }
}
