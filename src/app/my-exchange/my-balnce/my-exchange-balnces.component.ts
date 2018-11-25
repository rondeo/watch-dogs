import {Component, OnDestroy, OnInit} from '@angular/core';
import {ConnectorApiService} from '../services/connector-api.service';
import {VOBalance, VOTransfer} from '../../models/app-models';
import {MarketCapService} from '../../market-cap/services/market-cap.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog, MatSelectChange, MatSnackBar} from '@angular/material';
import * as _ from 'lodash';
import {ApisPrivateService} from '../../apis/api-private/apis-private.service';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {E} from '@angular/core/src/render3';

import {MyExchangeService} from '../services/my-exchange.service';
import {ShowExternalPageService} from '../../services/show-external-page.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {VOMCObj} from '../../models/api-models';
import {UserLoginService} from '../../services/user-login.service';

@Component({
  selector: 'app-my-balnce',
  templateUrl: './my-exchange-balnces.component.html',
  styleUrls: ['./my-exchange-balnces.component.css']
})
export class MyExchangeBalncesComponent implements OnInit, OnDestroy {

  exchangesPrivate: string[];

  balancesAr: VOBalance[];
  balancesAll: VOBalance[];
  total: number;
  transfers: VOTransfer[];
  exchange: string;
  isPendingOrders: boolean;
  MC: VOMCObj;

  constructor(
    private privateService: MyExchangeService,
    private apisPublic: ApisPublicService,
    private apisPrivate: ApisPrivateService,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private marketCap: ApiMarketCapService,
    private myService: MyExchangeService,
    private externalPage: ShowExternalPageService,
    private userLogin: UserLoginService
  ) {
  }


  ngOnDestroy() {
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.sub2.unsubscribe();
  }

  private sub1;
  private sub2;

  ngOnInit() {
    this.exchangesPrivate = this.privateService.getMyPivateExchanges()
    this.route.params.subscribe(params => {
      if (this.exchange !== params.exchange) {
        this.balancesAll = [];
        this.balancesAr = [];
      }

      this.exchange = params.exchange;
      if (!this.MC) this.initAsync();
      else this.subscribe();
      // this.dowloadAllBalances();
    })

  }

  async initAsync() {
    this.MC = await this.marketCap.getTicker();
    this.subscribe();

  }

  subscribe() {
    if(!this.exchange) return;
    if (this.sub1) this.sub1.unsubscribe();
    this.sub1 = this.apisPrivate.getExchangeApi(this.exchange).balances$().subscribe(balances => {

      if (!balances) return;
      const MC = this.MC;
      // console.log(this.balancesAll);
      console.log(balances);
      this.balancesAll = balances;
      this.balancesAll.forEach(function (item) {
        const coinMC = MC[item.symbol];
        if (coinMC) {
          item.id = coinMC.id;
          item.balanceUS = Math.round(item.balance * coinMC.price_usd);
        } else item.balanceUS = item.balance;
      });

      this.render();
    })
    this.refreshBalances();
  }

  /*async dowloadAllBalances() {
    if(!this.exchange) return;
    this.isBalancesLoading = true;
    this.MC = await this.marketCap.getTicker();
   // console.log(this.exchange);

    this.balancesAll = await  this.privateService.getBalancesAll(this.exchange, true);
    const MC = this.MC;
    // console.log(this.balancesAll);
   // console.log(this.balancesAll);
    this.balancesAll.forEach(function (item) {
      const coinMC = MC[item.symbol];
      if (coinMC) {
        item.id = coinMC.id;
        item.balanceUS = Math.round(item.balance * coinMC.price_usd);
      } else item.balanceUS = 0;
    })
    this.isBalancesLoading = false;
    this.render();
  }
*/
  isShowAll: boolean;

  private render() {

    let ar: VOBalance[];

    if (this.isShowAll) {
      ar = this.balancesAll;
    } else ar = this.balancesAll.filter(function (item) {
      return item.balanceUS;
    });

    this.total = Math.round(ar.reduce(function (a, b) {
      return a + +b.balanceUS;
    }, 0));

    this.balancesAr = ar.sort(function (a, b) {
      return +a.balanceUS > +b.balanceUS ? -1 : 1;
    });
  }

  sortByBalance() {

    if (this.sortBy === 'balanceUS') {
      this.asc_desc = (this.asc_desc === 'asc') ? 'desc' : 'asc';
    }
    this.sortBy = 'balanceUS';
    this.balancesAr = _.orderBy(this.balancesAr, 'balanceUS', this.asc_desc);//.sort(function (a, b) { return +a.balanceUS > +b.balanceUS?-1:1; });
  }

  onShowAll(evt) {
    this.isShowAll = evt.checked;
    this.render()
  }


  isBalancesLoading = false

  async onBalanceClick(balance: VOBalance) {
    const symbol = balance.symbol;
    this.router.navigateByUrl('/my-exchange/buy-sell/' + this.exchange + '/BTC_' + symbol)
    //  console.log(balance)

  }

  refreshBalances() {
    this.apisPrivate.getExchangeApi(this.exchange).refreshBalances();
  }

  sortBy: string;
  asc_desc = 'desc';

  onSortClick(criteria: string): void {
    // console.log(criteria);
    if (this.sortBy === criteria) {
      this.asc_desc = (this.asc_desc === 'asc') ? 'desc' : 'asc';
    }

    this.sortBy = criteria;
    this.sortData();
  }

  sortData() {

    this.balancesAr = _.orderBy(this.balancesAr, this.sortBy, this.asc_desc);

  }

  onSymbolClick(balance) {
    this.router.navigateByUrl('/trader/analyze-coin/' + balance.symbol + '/' + this.exchange);
  }

  onPriceClick(balance: VOBalance) {

    this.externalPage.showCoinOnMarketCap(balance.symbol);
  }

  onEchangeChanged(evt: MatSelectChange) {
    //console.log(exch);
    this.router.navigateByUrl('/my-exchange/balances/' + evt.value, {replaceUrl: true});
  }

  onKeyClick() {
    if (this.exchange) {
      this.userLogin.setExchnageCredentials(this.exchange).then(res => {
        this.apisPrivate.getExchangeApi(this.exchange).createLogin();
      })

      // this.apisPrivate.getExchangeApi(this.exchange).resetCredetials();
      //this.apisPrivate.getExchangeApi(this.exchange).createLogin();
    }

  }

}
