import {Component, OnDestroy, OnInit} from '@angular/core';
import {VOBalance, VOTransfer} from '../../models/app-models';
import {MarketCapService} from '../../market-cap/services/market-cap.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog, MatSelectChange, MatSnackBar} from '@angular/material';
import * as _ from 'lodash';
import {ApisPrivateService} from '../../apis/api-private/apis-private.service';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';

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

  constructor(
    private apisPublic: ApisPublicService,
    private apisPrivate: ApisPrivateService,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private marketCap: ApiMarketCapService,
    private externalPage: ShowExternalPageService,
    private userLogin: UserLoginService
  ) {
  }

  exchangesPrivate: string[];

  balancesAr: VOBalance[];
  balancesAll: VOBalance[];
  total: number;
  transfers: VOTransfer[];
  exchange: string;
  isPendingOrders: boolean;
  MC: VOMCObj;

  market: string;

  private sub1;
  private sub2;

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
  isBalancesLoading = false;
  sortBy: string;
  asc_desc: 'asc' | 'desc' = 'asc';

  ngOnDestroy() {
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.sub2.unsubscribe();
  }

  ngOnInit() {


    this.exchangesPrivate = this.apisPrivate.getAllAvailable();
    this.route.params.subscribe(params => {
      if (this.exchange !== params.exchange) {
        this.balancesAll = [];
        this.balancesAr = [];
      }

      this.exchange = params.exchange;
      this.market = params.market;
      if(this.market === 'undefined' || this.market === 'null') this.market = null;

      if (!this.MC) this.initAsync();
      else this.subscribe();
      // this.dowloadAllBalances();
    });

  }

  async initAsync() {
    this.MC = await this.marketCap.getTicker();
    this.subscribe();
  }

  subscribe() {
    if (!this.exchange) return;
    if (this.sub1) this.sub1.unsubscribe();
    this.sub1 = this.apisPrivate.getExchangeApi(this.exchange).balances$().subscribe(balances => {

      if (!balances) return;
      const MC = this.MC;
      // console.log(this.balancesAll);
     //  console.log(balances);
      this.balancesAll = balances;
      this.balancesAll.forEach(function (item) {
        const coinMC = MC[item.symbol];
        if (coinMC) {
          item.id = coinMC.id;
          item.balanceUS = Math.round(item.balance * coinMC.price_usd);
        } else {
          if(item.symbol === 'USD')  {
            item.balanceUS = item.balance;
          }
          else item.balanceUS = 0;
        }
      });

      this.render();
    });
    this.refreshBalances();
  }

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
    this.balancesAr = _.orderBy(this.balancesAr, 'balanceUS', this.asc_desc);
    // .sort(function (a, b) { return +a.balanceUS > +b.balanceUS?-1:1; });
  }

  onShowAll(evt) {
    this.isShowAll = evt.checked;
    this.render();
  }

  async onBalanceClick(balance: VOBalance) {
    const symbol = balance.symbol;
    this.router.navigateByUrl('/my-exchange/buy-sell/' + this.exchange + '/BTC_' + symbol);
    //  console.log(balance)

  }

  refreshBalances() {
    this.apisPrivate.getExchangeApi(this.exchange).refreshBalances();
  }

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
    let market = 'BTC_' + balance.symbol;
    if(balance.symbol === 'BTC' || balance.symbol === 'USDT') market = 'USDT_BTC';
    const exchange =  this.exchange;
    this.router.navigate(['/my-exchange/balances', {exchange, market}], {replaceUrl: true});
  }

  onPriceClick(balance: VOBalance) {

    this.externalPage.showCoinOnMarketCap(balance.symbol);
  }

  onEchangeChanged(evt: MatSelectChange) {
    const exchange =  evt.value;
    const market = null;
    this.router.navigate(['/my-exchange/balances', {exchange, market}], {replaceUrl: true});
  }

  onKeyClick() {
    if (this.exchange) {
      this.userLogin.setExchnageCredentials(this.exchange).then(res => {
        this.apisPrivate.getExchangeApi(this.exchange).createLogin();
      });

      // this.apisPrivate.getExchangeApi(this.exchange).resetCredetials();
      // this.apisPrivate.getExchangeApi(this.exchange).createLogin();
    }

  }

}
