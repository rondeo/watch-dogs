import {Component, OnDestroy, OnInit} from '@angular/core';
import {VOBalance, VOMarket, VOMarketCap, VOOrder, VOOrderBook, VOTransfer} from "../../models/app-models";
import {MarketCapService} from "../../market-cap/market-cap.service";
import {MatSnackBar} from "@angular/material";
import {ActivatedRoute, Router} from "@angular/router";
import {BittrexPrivateService} from "../bittrex-private.service";
import {Subscription} from "rxjs/Subscription";
import {EventTransfer, TransferReqest} from "../transfer-reqest";

@Component({
  selector: 'app-bittrex-transfer',
  templateUrl: './bittrex-transfer.component.html',
  styleUrls: ['./bittrex-transfer.component.css']
})
export class BittrexTransferComponent implements OnInit, OnDestroy {



  order:VOOrder;

  transfer:VOTransfer = {
    uuid:null,
    action:'Sell',
    market:'',

    base:'',
    amountBase:0,
    amountBaseUS:0,
    priceBaseUS:0,

    rate:0,

    coin:'',
    amountCoin:0,
    amountCoinUS:0,
    priceCoinUS:0,


    fee:0,
    feeUS:0,
    timestamp:0,
    valid:false,

    isComplete:false,
    isActive:false

  };


  transaferMarkets:VOMarket[];
  transferToCoins:string[];

  orderBookBuy:VOOrderBook[];
  orderBookSell:VOOrderBook[];

  balanceFrom:VOBalance;
  balanceTo:VOBalance;
  fee:number = 0.0025;
  currentMarket:VOMarket = new VOMarket();

  amountFromUS:number;
  amountFrom:number;
  symbolFrom:string;
  amountTo:number;
  amountToUS:number;
  symbolTo:string;
  sumbolToPrice:number;

  ratePrice:string;

  transferId:string;
  //transferRate:number;

  //marketCap:MarketCapService;

  MC:{[symbol:string]:VOMarketCap};

  basePrice:number;


  isShowAll:boolean;


  constructor(
    private route:ActivatedRoute,
    private router:Router,
    private privateService:BittrexPrivateService,
    private snackBar:MatSnackBar
  )
  {
    this.balanceFrom = new VOBalance();


  }

  ngOnDestroy(){
    this.sub1.unsubscribe();
    this.sub2.unsubscribe();
  }
  private sub1:Subscription;
  private sub2:Subscription;

  ngOnInit() {

    let sub = this.privateService.marketCap.getCoinsObs().subscribe(res=>{
      if(!res) return;
      this.MC = res;
      setTimeout(()=>{
        if(sub) sub.unsubscribe();
      }, 100)

    });

    let symbol = this.route.snapshot.paramMap.get('symbol');


    this.sub2 = this.privateService.publicService.serachResults$.subscribe(res=>{
     // console.log(res);
      //this.symbolMarkets = res;
      this.transaferMarkets = res;



     /* this.transferToCoins = res.map(function (item) {
        let coin = this.symbol;
        if(item.base !==this.symbol) coin = item.base;
        else coin = item.coin;
        return coin;
      }, {symbol:this.balanceFrom.symbol})
*/

      if(this.transaferMarkets.length ===0){
        this.snackBar.open('You dont have wallet for market '+symbol,'x');
      } else  this.renderSelect();
    });


    this.sub1 = this.privateService.balances$.subscribe(balances=>{
      if(!balances) return;


      this.balanceFrom = balances.find(function (item) {
        return item.symbol === symbol;
      });

      if(+this.balanceFrom.balance === 0){
        this.snackBar.open('You cant transfer empty balance','x');
        return;
      }

      this.setBalances(balances);

      this.amountFromUS = this.balanceFrom.balanceUS;
      this.amountFrom = this.balanceFrom.available;
      this.symbolFrom = this.balanceFrom.symbol;

      this.privateService.publicService.searchCoinMarkets(symbol);

    });

    this.privateService.loadBalances();
  }


  setBalances(balances:VOBalance[]){

    let base = this.transfer.base;

    let coin = this.transfer.coin;
    if(coin){
      let balance = balances.find(function (item) {
        return item.symbol === coin;
      });

      if(balance){
        this.transfer.amountCoin = balance.balance;
        if(this.transfer.rate){

        }

      }

    }
  }
  
  adjustCoinPrice(){

    let rate = this.transfer.rate;
    if(!rate) return;
    let basePrice = this.basePrice;
    this.transfer.priceCoinUS = basePrice * rate;
    this.transfer.amountCoinUS = this.transfer.amountCoin * this.transfer.priceCoinUS;
  }


  calculateTo(){
    if(!this.transfer.rate || !this.amountFrom){
      this.amountToUS = 0;
      this.amountTo = 0;
      return
    }

    let MC = this.MC



    let mcBase  = MC[this.currentMarket.base];
    if(mcBase)  this.ratePrice = (mcBase.price_usd * this.transfer.rate).toFixed(2);

    let fee = this.amountFrom * this.fee;

    if(this.transfer.action ==='Buy'){

      this.amountTo = +((this.amountFrom - fee) / this.transfer.rate).toPrecision(8);
      this.transfer.amountCoin = this.amountTo;

    }else if(this.transfer.action === 'Sell') {
      this.amountTo = +((this.amountFrom - fee) * this.transfer.rate).toPrecision(8);
      this.transfer.amountCoin = this.amountFrom;
    }



    let mc = MC[this.symbolTo];
    if(mc)  this.sumbolToPrice = mc.price_usd;
    this.amountToUS =  +(this.amountTo * this.sumbolToPrice).toFixed(2);

    if(this.amountFromUS <= this.balanceFrom.balanceUS) this.transfer.valid = true;
    else this.transfer.valid = false;

  }

  onAmountUSChange(evt){

    console.log(this.amountFromUS);
    this.amountFrom = +(this.amountFromUS / this.balanceFrom.priceUS).toPrecision(8);
    this.calculateTo();

  }


 /* downloadBooks(){
    let market =  this.transfer.market;
    return this.privateService.publicService.getOrderBook(market).map(res=>{

      console.log(res.buy.length);
      console.log(res.sell.length);
      this.orderBookBuy = res.buy;//.slice(0, 20);
      this.orderBookSell = res.sell;//.slice(0, 20);

      if(this.transfer.action ==='Sell') this.transfer.rate = this.orderBookBuy[0].Rate;
      if(this.transfer.action ==='Buy') this.transfer.rate = this.orderBookSell[0].Rate;

      this.calculateTo()
    }).toPromise();
  }*/

  onRefreshRateClick(){
    this.downloadRate();
  }


  downloadRate(){

    let amountCoin = 0;//this.amountFrom;
    let amountBase = this.amountFrom;
    let symbolFrom  = this.symbolFrom;
    let ar = this.transfer.market.split('_');
    if(symbolFrom === ar[0]){
      amountBase = this.amountFrom;
      amountCoin = 0;
    }else if(symbolFrom === ar[1]){
      amountBase = 0;
      amountCoin = this.amountFrom;
    } else {
      console.error(' no coin on market ')
      return;
    }

    TransferReqest.getRate(this.transfer.market, this.transfer.action, amountCoin, amountBase, this.privateService.publicService).then(rate=>{

      this.transfer.rate = rate;
      this.calculateTo();
    });
  }

  onCoinSelected(evt){
    let coin1 = evt.value;
    this.symbolTo = coin1;
    let balanceTo = this.privateService.getBalanceBySumbol(coin1);
    if(balanceTo) {
      this.balanceTo = balanceTo;
    }
    let coin2 = this.balanceFrom.symbol;
    this.currentMarket =  this.transaferMarkets.find(function (item) {
      return (item.pair.indexOf(coin1) !==-1 && item.pair.indexOf(coin2) !==-1 && (item.pair.length -1 === (coin1.length + coin2.length)));
    });

    if(!this.currentMarket) {
      console.error(' cant find market');
      return;
    }

    this.transfer.market = this.currentMarket.pair;

    if(coin1 === this.currentMarket.coin){
      this.transfer.action = 'Buy';

    }
    else {
      this.transfer.action = 'Sell';

    }
    this.amountToUS = 0;
    this.amountTo = 0;
    this.transfer.rate = 0;
    this.downloadRate();

    console.log(this.currentMarket);

   // console.log(evt);
  }

  onAmounBalanceClick(){
    this.amountFromUS = this.balanceFrom.balanceUS;
    this.amountFrom = this.balanceFrom.available;
    this.calculateTo();
  }

  onSubmitClick() {

    let market: string = this.transfer.market,
      action: string = this.transfer.action;
    let amountCoin = this.transfer.amountCoin;

    let amountBase = 0;
    let message =' Transferring !!!  ' + market +' (' + action +') \n From '+ this.symbolFrom +': '+ this.amountFrom + ' ($' + this.amountFromUS +') '+
      ' to '+this.symbolTo +': '+this.amountTo + ' ($' + this.amountToUS+')';
    message +=' \n Note during transfer the best books values will be used';

    console.log(this.transfer);

    console.log(market, action, amountCoin, amountBase);

    if(confirm(message)){


      let request: TransferReqest = new TransferReqest(this.privateService, this.privateService.publicService);




      console.log(message);

      request.setTransfer(market, action, amountCoin, amountBase).then(res => {
        console.log(' transfer resulys ', res);

        this.privateService.loadBalances();

      }).catch(err => {

          console.error(err)

      });


      let sub = request.emitter.subscribe(res=>{
        console.warn(res);
        switch(res.event){
          case EventTransfer.ON_RATE:
            console.log(' rate ' + res.data);
            break;
          case EventTransfer.ON_TRY_AGAIN:
            console.log(' try again ' + res.message);
            break;
          case EventTransfer.ON_ORDER_SET:
            this.transfer.uuid = res.message;
            this.snackBar.open(' Orders set. Please wait 3 sec', 'x', {duration:3000});


            console.log(' !!!!!  uuid:' + res.message);
            break;
          case EventTransfer.ON_ERROR:

            console.log('%c ERROR ' + res.message, 'color:red');
            break;
          case EventTransfer.ON_CHECKING_ORDRER:
            console.log(' ON_CHECKING_ORDRER ' + res.message);
            break;
          case EventTransfer.ON_ORDER_CHECK_RESULT:
            console.log(' ON_ORDER_CHECK_RESULT ', res.data);
            break;

          case EventTransfer.ON_ORDER_END:
            console.log('ON_ORDER_END', res.data);

           this.snackBar.open('Transfer complete !!!','x');
            this.checkBalances();
            break;

          case EventTransfer.ON_DESTROY:
            console.log('ON_DESTROY');
            sub.unsubscribe();

            break;

        }
      });

      request.onOrderSet = (result)=>{
       // console.warn('onOrderSet', result);

        if(result.success && result.result.uuid){
        }
        else this.snackBar.open(result.message, 'x');


      }
      request.onRate = (rate)=>{
        this.transfer.rate = rate;
        //console.warn('onRate', rate);
      }
      request.onOrderCheck = (res)=>{
        this.order = res;
        console.warn('onOrderCheck', res);
      }

      request.startProcess();

    }
  }



  checkBalances(){

    let sub = this.privateService.balances$.subscribe(res=>{

      console.log('checkBalances', res)
      this.balanceFrom =  this.privateService.getBalanceBySumbol(this.balanceFrom.symbol);
      this.balanceTo =  this.privateService.getBalanceBySumbol(this.balanceTo.symbol);
      setTimeout(()=>sub.unsubscribe(), 100);
    })

    this.privateService.refreshBalances()
  }
  onTransferUidClick() {
    this.privateService.getOrderById(this.transfer.uuid).subscribe(res=>{
      console.log(res);
      this.order = res;
    }, err=>{
      console.warn(err);
      this.snackBar.open(JSON.stringify(err), 'x');
    })

  }

  onCancelOrderClick() {

    if(!confirm('You want to cancel order ' + this.transfer.uuid +'?')) return;

    this.privateService.cancelOrder(this.transfer.uuid).subscribe(res=>{
      console.log(res)
      this.snackBar.open(JSON.stringify(res), 'x');
    }, err=>{
      console.warn(err)
      this.snackBar.open(JSON.stringify(err), 'x');
    })


  }

  private renderSelect(){

    let markets  = this.transaferMarkets;

    let available  = markets.map(function (item) {
      let coin = this.symbol;
      if(item.base !==this.symbol) coin = item.base;
      else coin = item.coin;
      return coin;
    }, {symbol:this.balanceFrom.symbol})

    if(this.isShowAll) this.transferToCoins = available;
    else {
      let ar  = this.privateService.getBalances();
      let myCoins = ar.map(function (item) {
        return item.symbol;
      })

      this.transferToCoins =  available.filter(function (item) {
        return myCoins.indexOf(item) !==-1;
      })

    }
  }

  onShowAll(evt){
    this.isShowAll = evt.checked;
    this.renderSelect()
  }

  isAddress:boolean
  onShowAddressClick(){
    this.isAddress = !this.isAddress;
  }
}
