import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BittrexPrivateService} from '../bittrex-private.service';
import {VOBalance, VOMarketB, VOMarketCap, VOOrder, VOTransfer} from '../../models/app-models';
import * as _ from 'lodash';
import {MatDialog, MatSnackBar} from '@angular/material';
import {MarketsSummaryComponent} from '../markets-summary/markets-summary.component';
import {MarketsSummaryDialog} from '../markets-summary/markets-summary.dialog';
import {Router} from '@angular/router';
import {BittrexBuySellComponent} from '../bittrex-buy-sell/bittrex-buy-sell.component';
import {MarketCapService} from '../../market-cap/market-cap.service';
import {BittrexService} from '../../exchanges/services/bittrex.service';
import {Subscription} from 'rxjs/Subscription';

@Component({
  selector: 'app-bittrex-balances',
  templateUrl: './bittrex-balances.component.html',
  styleUrls: ['./bittrex-balances.component.css']
})
export class BittrexBalancesComponent implements OnInit, OnDestroy {

  @ViewChild('checkbox1') checkbox1;



  balancesAr:VOBalance[];
  data:VOBalance[];
  total:string;




  transfers:VOTransfer[];

  isLocalHistory:boolean;
  isPendingOrders:boolean;

  mc;
  //baseMarkets:VOMarketB[];
 /// baseMarketsTitle:string;
 // requestedMarkets:VOMarketSummary[]
 // requestedMarketsTitle:string;
  constructor(
    private bitrexService:BittrexPrivateService,
    private dialog:MatDialog,
    private router:Router,
    private snackBar:MatSnackBar,
    private marketCap:MarketCapService
  ) {




  }

  private sub1:Subscription;
  private sub2:Subscription;

  ngOnDestroy(){
    console.warn('destroy balances');
    this.sub1.unsubscribe();
    this.sub2.unsubscribe();
  }
  ngOnInit() {

    this.bitrexService.isLoggedIn$.subscribe(res=>{

      if(res) this.bitrexService.loadBalances();
      })

    this.sub2 = this.marketCap.getCoinsObs().subscribe(res=>{
      if(!res) return;
      this.mc = res;
      this.parceMarketCap();
    })

    console.log(' subscribe ')
   this.sub1 =  this.bitrexService.balances$.subscribe(res=>{
     //console.log ('balances res', res);
      if(!res) return;

      this.data = res;
      this.parceMarketCap();

    });

    this.bitrexService.loadBalances();

  }




  parceMarketCap(){
    if(!this.mc || ! this.data) return;
    let all = this.mc;
    let bals = this.data;

          bals.forEach(function (item) {
            let mc: VOMarketCap = all[item.symbol];
            if (mc) {
              item.priceUS = +mc.price_usd.toFixed(2);
              item.balanceUS = +(+item.balance * mc.price_usd).toFixed(2);
              item.id = mc.id;
              item.percent_change_1h = mc.percent_change_1h;
              item.percent_change_24h = mc.percent_change_24h;
              item.percent_change_7d = mc.percent_change_7d;
            }
          }, {all: all});
    this.render();
  }




  refresh(){
    this.bitrexService.refreshBalances();

  }
  //https://www.bit
  // trex.com/Market/Index?MarketName=ETH-CVC

  onChartClick(balance:VOBalance) {
   let mc =  this.bitrexService.publicService.marketCap.getCoinBySymbol(balance.symbol);

    if(mc)window.open('https://coinmarketcap.com/currencies/' + mc.id, '_blank');
    else this.snackBar.open('No coin for symbol '+balance.symbol);

    //let mc = this.marketCap.getBySymbol(balance.symbol);
    //if (mc) window.open('https://coinmarketcap.com/currencies/' + mc.id, '_blank');

  }
  onChartBClick(balance:VOBalance) {

    let url = 'https://www.bittrex.com/Market/Index?MarketName=BTC-'+ balance.symbol;
    window.open(url, '_blank');

   /// if(mc
    //else this.snackBar.open('No coin for symbol '+balance.symbol);

    //let mc = this.marketCap.getBySymbol(balance.symbol);
    //if (mc) window.open('https://coinmarketcap.com/currencies/' + mc.id, '_blank');

  }

  private render(){

    let ar:VOBalance[];

    if(this.isShowAll){
      ar = this.data;
    }else  ar = this.data.filter(function (item) {
      return +item.balance !==0;
    });

    this.total  = ar.reduce(function (a, b) {  return a+ +b.balanceUS; },0).toFixed(2);
    this.balancesAr = ar.sort(function (a, b) { return +a.balanceUS > +b.balanceUS?-1:1; });
  }
  isShowAll:boolean
  onShowAll(evt){
    this.isShowAll = evt.checked;
    this.render()
  }


  isNewWallet:boolean
  newWallet:VOBalance;
  currencies:{
    Currency: string;
    CurrencyLong: string;
    MinConfirmation:number;
    TxFee:number;
    IsActive:boolean;
  }[];
  onNewWalletClick() {


    this.isNewWallet = !this.isNewWallet;
    if(!this.isNewWallet){
      this.newWallet = null;
      return
    }


    this.bitrexService.publicService.getCurrencies().subscribe(res=>{

      this.currencies = _.orderBy(res,'Currency');
      console.log(res);
    })


  }

  onCreateClick() {
    console.log(this.newWallet);

    if(!confirm('You want to creatre new wallet '+ this.newWallet.symbol))return;
    this.bitrexService.createWallet(this.newWallet.symbol).subscribe(res=>{
      console.log(res);
      if(!res.result){
        this.snackBar.open('Creating wallet, Please wait 1 minite','x');
      } else  this.bitrexService.refreshBalances()

    })

  }


  onCurrencySelected(evt) {

    let cur:any = evt.value;
   let bal =  this.bitrexService.getBalanceBySumbol(cur.Currency);
   if(bal){
     this.snackBar.open('You have wallet '+ cur.Currency + ' '+ cur.CurrencyLong, 'x');
     this.newWallet = null;
     return
   }

    this.newWallet = new VOBalance();
    this.newWallet.symbol = cur.Currency;
  }

  /// bdb772a5-b2ea-4973-b581-a5d813b38c1b


  onLocalHistoryClick() {
    this.isLocalHistory = !this.isLocalHistory;
    if(!this.isLocalHistory) return;
    if(!this.transfers)  this.transfers = this.bitrexService.getTransfers();

  }

  isBalances=true;
  onBalancesClick() {
    this.isBalances = !this.isBalances;

  }



  onTransferRemove(transfer: VOTransfer) {
    if(confirm('You wont to remove from local history transfer \n '+transfer.uuid+'?')){
      this.bitrexService.deleteTransferById(transfer.uuid);
    }
  }

 /* onUuidClick(transfer: VOTransfer) {
    this.bitrexService.getOrderById(transfer.uuid).subscribe(res=>{
      console.log(res);
      if(!this.pendingOrders) this.pendingOrders =[];
        this.pendingOrders.push(res);
      this.isPendingOrders = true;
    })
  }*/



  onShowCartClick(balance: VOBalance) {
    let mc = this.marketCap.getCoinBySymbol(balance.symbol);
    //if (mc) window.open('https://coinmarketcap.com/currencies/' + mc.id, '_blank');

    if (mc) window.open('https://coinmarketcap.com/currencies/' + mc.id, '_blank');
  }

  onTransferClick(balance: VOBalance) {
    this.router.navigateByUrl('/my-bittrex/transfer/'+ balance.symbol);
    //balance.isDetails = !balance.isDetails;
  }

  onSymbolClick(balance:VOBalance){
    let symbol = balance.symbol;
    let market = ''
    if(symbol ==='USDT') market = 'USDT-BTC';
    else if(symbol==='BTC' || symbol ==='ETH') market = 'USDT-'+symbol;
    else market = 'BTC-'+symbol;

    window.open('https://bittrex.com/Market/Index?MarketName=' + market, '_blank');


  }
}
