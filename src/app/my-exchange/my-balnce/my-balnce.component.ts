import {Component, OnDestroy, OnInit} from '@angular/core';
import {ConnectorApiService} from '../services/connector-api.service';
import {VOBalance, VOTransfer} from '../../models/app-models';
import {MarketCapService} from '../../market-cap/services/market-cap.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog, MatSnackBar} from '@angular/material';
import {ApiBase} from '../services/apis/api-base';
import * as _ from 'lodash';
import {ApisPrivateService} from '../../apis/apis-private.service';
import {ApisPublicService} from '../../apis/apis-public.service';
import {E} from '@angular/core/src/render3';
import {VOMC, VOMCObj} from '../../apis/models';
import {MyExchangeService} from '../services/my-exchange.service';

@Component({
  selector: 'app-my-balnce',
  templateUrl: './my-balnce.component.html',
  styleUrls: ['./my-balnce.component.css']
})
export class MyBalnceComponent implements OnInit, OnDestroy {


  balancesAr: VOBalance[];
  balancesAll: VOBalance[];
  total: string;
  transfers: VOTransfer[];

  exchange: string;

  isPendingOrders: boolean;
  MC:VOMCObj;

  currentConnector: ApiBase;

  constructor(
    //  private apiService:ConnectorApiService,
    private apisPrivate: ApisPrivateService,
    private apisPublic: ApisPublicService,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private marketCap: MarketCapService,
    private myService: MyExchangeService
  ) {
  }


  ngOnDestroy() {
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.sub2.unsubscribe();
  }

  private sub1;
  private sub2;

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.exchange = params.exchange;
      this.dowloadAllBalances();
    })


    /*this.sub1 = this.apiService.connector$().subscribe(connector => {
      this.currentConnector = connector;
      if (!connector) return;

      if(this.sub2)this.sub2.unsubscribe();

      this.sub2 =  connector.balances$().subscribe(res=>{
        this.isBalancesLoading = false;
        if(!res) return;
        this.data = res.filter(function (item) {
          return !!item.id;
        });

        this.render();
      });

      /!*connector.isLogedIn$().subscribe(logedIn => {
        connector.

      })*!/

    });*/

  }

  async dowloadAllBalances() {
    this.isBalancesLoading = true
    const api = this.apisPrivate.getExchangeApi(this.exchange);
    if(!api) throw new Error(' no api for ' + this.exchange);
    this.MC = await this.marketCap.getCoinsObs().toPromise();
    this.balancesAll  = await  api.downloadBalances().toPromise();
    const MC = this.MC;
    this.balancesAll.forEach(function (item) {
      const coinMC = MC[item.symbol];
      if(coinMC){
        item.id = coinMC.id;
        item.balanceUS = +(item.balance * coinMC.price_usd).toFixed(2);
        item.priceUS = coinMC.price_usd;
        item.percent_change_1h = coinMC.percent_change_1h;
        item.percent_change_24h = coinMC.percent_change_24h;
        item.percent_change_7d = coinMC.percent_change_7d;
      } else item.balanceUS = 0;

    })
    this.isBalancesLoading = false;
    this.render();
  }

  isShowAll: boolean;

  private render() {

    let ar: VOBalance[];

    if (this.isShowAll) {
      ar = this.balancesAll;
    } else ar = this.balancesAll.filter(function (item) {
      return +item.balance !== 0;
    });

    this.total = ar.reduce(function (a, b) {
      return a + +b.balanceUS;
    }, 0).toFixed(2);

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

  async onBalanceClick(balance: VOBalance){
    const symbol = balance.symbol;
    this.router.navigateByUrl('/my-exchange/buy-sell-coin/'+ this.exchange + '/'+ symbol)
    console.log(balance)

  }

  refreshBalances() {
    this.dowloadAllBalances();
  }

  sortBy: string;
  asc_desc = 'desc';

  onSortClick(criteria: string): void {
    console.log(criteria);

    if (this.sortBy === criteria) {
      this.asc_desc = (this.asc_desc === 'asc') ? 'desc' : 'asc';
    }

    this.sortBy = criteria;
    this.sortData();
  }

  sortData() {

    this.balancesAr = _.orderBy(this.balancesAr, this.sortBy, this.asc_desc);

  }

  onSymbolClick(balance){


  }

  onPriceClick(balance){

  }

}
