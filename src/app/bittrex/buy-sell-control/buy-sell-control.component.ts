import {Component, Input, OnInit, Output, SimpleChange} from '@angular/core';
import {BooksService, VOBooksRate} from "../../services/books-service";
import {OrdersManagerService} from "../../services/orders-manager.service";
import {MatSnackBar} from "@angular/material";
import {BittrexPrivateService} from "../bittrex-private.service";
import {BittrexService} from "../../exchanges/services/bittrex.service";
import {Observable} from "rxjs/Observable";
import {APIBuySellService} from "../../services/buy-sell.service";
import {VOORDER, VOOrder} from "../../models/app-models";
import {Subscription} from "rxjs/Subscription";

@Component({
  selector: 'app-buy-sell-control',
  templateUrl: './buy-sell-control.component.html',
  styleUrls: ['./buy-sell-control.component.css']
})
export class BuySellControlComponent implements OnInit {

  constructor(
    private publicService:BittrexService,
    private privateService:BittrexPrivateService,
    private booksService:BooksService,
    private ordersManager:OrdersManagerService,
    private snackBar:MatSnackBar
  ) {

    ordersManager.setService(privateService);
    booksService.setService(publicService);
    this.currentOrder = VOORDER;
  }


  rateByBooks:VOBooksRate ={
    buy:0,
    buyUS:0,
    sell:0,
    sellUS:0
  };

  @Input() exchange:string;

  @Input() priceBaseUS:number;
  @Input() base:string;

  @Input() balanceBase:number;

  @Input() coin:string;
 // @Input() balanceCoin:number;
  @Input() balanceCoin:number;

  @Input() ordersHistory:VOOrder[];

  @Output() currentOrder:VOOrder;


  oredrCopmlete:VOOrder;




  amountUS:number = 50;

 // amountBaseUS:number;

  amountBase:number;

  rate:number;

  buyChange:number;
  buyColor:string;

  sellChange:number;
  sellColor:string;

  percentDiff:number = 0;

  ngOnChanges(changes){
    if(changes.base || changes.coin){
      this.setMarket();
    }
    if(changes.priceBaseUS){
      this.setAmount();
     // this.updateBooks();
    }

    console.log(changes);
  }


  private sub3:Subscription;


  ngOnInit() {

    this.sub3 =  this.booksService.subscribeForRate().subscribe(booksRate=>{
      if(!booksRate) return;
      this.updateBooks(booksRate);
    })


  }



  updateBooks(booksRate?){

    if(!booksRate) booksRate  =  this.rateByBooks;

    let newBuy = +(booksRate.buy * this.priceBaseUS).toPrecision(4);;
    let newSell = +(booksRate.sell * this.priceBaseUS).toPrecision(4);

    this.percentDiff = +(100 * (newSell - newBuy)/newSell).toFixed(2);
    let oldBooks = this.rateByBooks;

    if(oldBooks.buyUS && oldBooks.sellUS){


      this.buyChange = +(100 * (oldBooks.buyUS - newBuy)/oldBooks.buyUS).toFixed(2);
      if(this.buyChange>0)this.buyColor = 'green';
      else if(this.buyChange<0)this.buyColor = 'red';
      else this.buyColor = '';

      this.sellChange = +(100 * (oldBooks.sellUS - newSell)/oldBooks.sellUS).toFixed(2);
      if(this.sellChange>0)this.sellColor = 'green';
      else if(this.sellChange<0)this.sellColor = 'red';
      else this.sellColor = '';
    }

    booksRate.buyUS =  newBuy;
    booksRate.sellUS =  newSell;
    this.rateByBooks = booksRate;
  }

  ngOnDestroy(){
    if(this.sub3)this.sub3.unsubscribe();
    if(this.sub4)this.sub4.unsubscribe();
    if(this.sub5)this.sub5.unsubscribe();
    this.ordersManager.destroy();
  }


  setMarket(){
    if(this.base && this.coin) this.booksService.setMarket(this.base, this.coin).then(res=>{ });
    this.rateByBooks = {buy:0, sell:0, buyUS:0, sellUS:0};
    this.sellChange = 0;
    this.buyColor ='';
    this.sellChange = 0;
    this.sellColor = '';
  }

  private setAmount(){
    if(!this.priceBaseUS) return;
    this.amountBase = +(this.amountUS / this.priceBaseUS).toPrecision(8);
    this.booksService.setAmount(this.amountBase);
  }
  onAmountChanged(evt){
   this.setAmount();
  }

  isBooksLoading:boolean;
  onRefreshBooksClick(){
    if(this.isBooksLoading){
      setTimeout(()=>{
        this.isBooksLoading = false;
      }, 2000);
      return;
    }
    this.isBooksLoading = true;
    this.booksService.refreshBooks().then(res=>{
      this.isBooksLoading = false;
    }).catch(err=>{
      this.isBooksLoading = false;
    })
  }

  private sub5;
  onCancelOrder(uuid:string){
    if(this.sub5) this.sub5.unsubscribe();
    this.sub5 = this.ordersManager.cancelOrder(uuid).subscribe(res=>{
      console.warn(res);
      this.currentOrder = res;

    })


  }

  private sub4;
  startCheckingOrder(uuid:string){
    if(this.sub4) this.sub4.unsubscribe();
    this.sub4 = this.ordersManager.startCheckingOrder(uuid).subscribe(res=>{
      console.log(res);
      if(!res.isOpen){
        this.privateService.refreshBalances();
        this.oredrCopmlete = res;
        this.currentOrder = VOORDER;
        this.snackBar.open('Complete ','x',{duration:2000, extraClasses:'alert-green'})

      }else{
        this.snackBar.open('In progress ','x',{duration:2000})
      this.currentOrder = res;
      }


    })
  }


  onBuyClick(){
    let action = 'Buy';
    let balance = this.balanceBase;

    let amounBase = this.amountUS / this.priceBaseUS;

    let isMax = (amounBase > balance);
    if(isMax) amounBase = (balance - (balance * 0.0025));
    this.processAction(action, amounBase, isMax);
  }

  onSellClick(){
    let action = 'Sell';
    let balance = this.balanceCoin;
    let rate = this.rate;
    let amountBase = this.amountUS / this.priceBaseUS;

    let amountCoin = amountBase / rate;

    let isMax = (amountCoin > balance);

    this.processAction(action, amountBase, isMax);

  }



  processAction(action,  amountBase, isMax){
    console.log(action);

    let base:string = this.base;
    let coin:string = this.coin;
   // let balanceCoin = this.balanceCoin;
    let priceBaseUS = this.priceBaseUS;

    //let amountBase = +(amountUS / priceBase).toFixed(8);


    console.log('amountBase ' + amountBase + ' priceBaseUS ' + priceBaseUS );

    this.booksService.refreshBooks(action, amountBase).then((rate)=>{

      console.log(rate);
      let amountCoin = +(amountBase / rate).toPrecision(5);

      if(action === 'Sell'){
        let balance = this.balanceCoin;
        balance = (balance - (balance * 0.0025));
        if(amountCoin > balance) amountCoin = balance;
      }

      let rateUS = (rate * priceBaseUS).toPrecision(4);

      // if(rate<1e-3) rate = +(rate.toFixed(8));
      console.log(' rateUS  ' + rateUS + ' rate ' + rate);


      console.log(' amountCoin ' + amountCoin + ' on balance ');

      let amountBaseUS = +(amountBase * priceBaseUS).toFixed(2);

      let fee = (amountBaseUS * 0.0025).toFixed(2);

      setTimeout(()=>{

        if(confirm( action +' x '+rateUS + ' \n' +coin  +' $'+ amountBaseUS +  '\nFee: $' + fee)){

          let service:APIBuySellService = this.privateService;
          let obs:Observable<VOOrder>
          if(action ==='Sell') obs =  service.sellLimit(base, coin, amountCoin, rate );
          else if(action ==='Buy')obs =  service.buyLimit(base, coin, amountCoin, rate );

          if(!obs) {
            console.error(action);
            return;
          }
          obs.subscribe(res=>{

            console.log(res);
            if(res && res.uuid){
              this.currentOrder = res;
              this.startCheckingOrder(res.uuid);
              this.snackBar.open('Order Set. Checking...'+res.message, 'x', {extraClasses:'alert-green', duration:2000});
            } else{
              this.snackBar.open('Error '+res.message, 'x', {extraClasses:'alert-red', duration:3000})
            }

          }, error=>{
            this.snackBar.open('Error '+ error.message, 'x',{extraClasses:'alert-red'});
          })

        }
      }, 200);


      //this.modelBuySell.balanceCoin


    })
  }





}
