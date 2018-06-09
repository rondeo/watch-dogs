import {Component, OnInit} from '@angular/core';
//import {AuthHttp} from './libs/angular2-jwt';
import {Router} from '@angular/router';
import {Http} from '@angular/http';
import {AuthHttpService, VOUser} from './services/auth-http.service';
import {MatDialog, MatSnackBar} from '@angular/material';
import {LoginFormComponent} from './material/login-form/login-form.component';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import {StorageService} from './services/app-storage.service';
import {MarketCapService} from './market-cap/services/market-cap.service';
import {ExchangeLogin, LoginStatus, UserLoginService} from './services/user-login.service';
import {LoginExchangeComponent} from './material/login-exchange/login-exchange.component';
import {AppBotsService} from './app-services/app-bots-services/app-bots.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit {
  title = 'app works!';
  menu: any;
  isLogedIn: boolean;
  nickname: string;
  countDown: number;
  historyCounter: number;

  sellCoinsCount: number;

  isMenu: boolean

  constructor(
    private auth: AuthHttpService,
    private storage: StorageService,
    private router: Router,
    private dialog: MatDialog,
    private userLogin: UserLoginService,
    private botsService: AppBotsService,
    private snackBar: MatSnackBar
  ) {
  }


  onRefreshClick() {


  }

  onExchangeLogin(loginType: ExchangeLogin) {
    let ref = this.dialog.open(LoginExchangeComponent, {
      width: '100vw',
      height: '300px'
    })
    ref.afterClosed().subscribe(data => {
      if (data && data.apiKey && data.password) {
        this.userLogin.setExchangeCredetials(loginType.exchange, JSON.stringify(data));
      }
    })

  }

  onApplicationLogin(loginType: ExchangeLogin) {
    let ref = this.dialog.open(LoginFormComponent, {
      width: '300px',
      height: '300px'
    })

    ref.afterClosed().subscribe(data => {

      if (data && data.email && data.password) {
        let salt = this.storage.hashPassword1(data.password);
        let password = this.storage.hashPassword1(salt);

        /*this.auth.login(data.email, password).toPromise().then((res:any)=>{
          console.log(res);
          this.auth.setUser(res.user);

        });*/
        this.userLogin.setSalt(data.email, salt, loginType);

        if (data.save) this.storage.storeUserSimple(data.email, salt);
      }


    })
  }

  onLogout() {
    if (confirm('You want to logout from Application')) {
      this.auth.logout().toPromise().then((res: any) => {
        console.log(res);
        if (res.success) this.auth.setUser(null);
        else this.snackBar.open(res.message, 'x', {extraClasses: ['alert-red']});
      }).catch(err => {
        this.snackBar.open('Connection error', 'x', {extraClasses: ['alert-red']});
      });
    }

  }

  onClearStorage() {
    if (confirm('You want to delete all data from storage?')) {
      localStorage.clear();
    }
  }

  bgColor = '';
  imageClass = '';

  ngOnInit(): void {

    this.userLogin.exchangeLogin$().subscribe(exchangeLogin => {
      //  console.log(exchangeLogin);
      if (exchangeLogin.status === LoginStatus.APPLICATION_LOGIN_REQIRED) this.onApplicationLogin(exchangeLogin);
      else if (exchangeLogin.status === LoginStatus.EXCHANGE_LOGIN_REQIRED) this.onExchangeLogin(exchangeLogin);

    })
    this.auth.isOnline$().subscribe(res => {
      this.imageClass = res ? '' : 'glow-red';
      this.bgColor = res ? '' : 'bg-red';
    });
  }

  onDogClick() {
    this.isMenu = !this.isMenu;
  }
}
