import {Component, Input, OnInit, Output} from '@angular/core';
import {BooksService, VOBooksRate} from "../../services/books-service";
import {OrdersManagerService} from "../../services/orders-manager.service";
import {MatSnackBar} from "@angular/material";
import {BittrexPrivateService} from "../bittrex-private.service";
import {BittrexService} from "../../exchanges/services/bittrex.service";
import {Observable} from "rxjs/Observable";
import {APIBuySellService} from "../../services/buy-sell.service";
import {VOOrder} from "../../models/app-models";
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
    this.currentOrder = {uuid:'', isOpen:false};
  }


  rateByBooks:VOBooksRate ={
    buy:0,
    buyUS:0,
    sell:0,
    sellUS:0
  };

  @Input() priceBaseUS:number;
  @Input() base:string;

  @Input() balanceBaseUS:number;

  @Input() coin:string;
 // @Input() balanceCoin:number;
  @Input() balanceCoinUS:number;

  @Output() currentOrder:VOOrder;

  amountUS:number;

 // amountBaseUS:number;

  amountBase:number;

  private sub3:Subscription;
  ngOnInit() {

    this.sub3 =  this.booksService.subscribeForRate().subscribe(booksRate=>{
      booksRate.buyUS =  +(booksRate.buy * this.priceBaseUS).toPrecision(4);
      booksRate.sellUS =  +(booksRate.sell * this.priceBaseUS).toPrecision(4);

      this.rateByBooks = booksRate;
    })


  }

  ngOnDestroy(){
    if(this.sub3)this.sub3.unsubscribe();
    if(this.sub4)this.sub4.unsubscribe();
    if(this.sub5)this.sub5.unsubscribe();
    this.ordersManager.destroy();
  }


  setMarket(){
    if(this.base && this.coin) this.booksService.setMarket(this.base, this.coin).then(res=>{ });

  }

  onAmountChanged(evt){
    console.log(this.amountBase);
    this.amountBase = +(this.amountUS / this.priceBaseUS).toPrecision(8);
    this.booksService.setAmount(this.amountBase);
  }

  onRefreshBooksClick(){
    this.booksService.refreshBooks();
  }

  onBuyClick(){
    let action = 'Buy';
    let balance = this.balanceBaseUS;

    let amountUS = this.amountUS;
    let isMax = (amountUS > balance);
    if(isMax) amountUS = (balance - (balance * 0.0025));
    this.processAction(action, amountUS, isMax);
  }

  onSellClick(){
    let action = 'Sell';
    let balance = this.balanceCoinUS;

    let amountUS = this.amountUS;
    let isMax = (amountUS > balance);
    if(isMax) amountUS = (balance - (balance * 0.0025));

    this.processAction(action, amountUS, isMax);

  }

  private sub5;
  cancelOrder(uuid:string){
    if(this.sub5) this.sub5.unsubscribe();
    this.sub5 = this.ordersManager.cancelOrder(uuid).subscribe(res=>{
      console.warn(res);
      //this.currentOrder = res;

    })


  }

  private sub4;
  checkOrder(uuid:string){
    if(this.sub4) this.sub4.unsubscribe();
    this.sub4 = this.ordersManager.checkOrder(uuid).subscribe(res=>{
      console.log(res);
      if(!res.isOpen){
        this.privateService.refreshBalances();
        this.snackBar.open('Complete ','x',{duration:2000, extraClasses:'alert-green'})

      }else{
        this.snackBar.open('In progress ','x',{duration:2000})
      }
      this.currentOrder = res;

    })
  }

  processAction(action,  amountUS, isMax){
    console.log(action);

    let base:string = this.base;
    let coin:string = this.coin;
   // let balanceCoin = this.balanceCoin;
    let priceBase = this.priceBaseUS;

    let amountBase = +(amountUS / priceBase).toFixed(8);


    console.log('amountBase ' + amountBase + ' priceBase ' + priceBase );

    this.booksService.refreshBooks(action, amountBase).then((rate)=>{

      console.log(rate);
      let rateUS = (rate * priceBase).toPrecision(4);

      // if(rate<1e-3) rate = +(rate.toFixed(8));
      console.log(' rateUS  ' + rateUS + ' rate ' + rate);
      let amountCoin = +(amountBase / rate).toPrecision(5);

      console.log(' amountCoin ' + amountCoin + ' on balance ');


      let fee = (amountUS * 0.0025).toFixed(2);

      setTimeout(()=>{

        if(confirm( action +' '+rateUS + ' \n' +coin  +' $'+ amountUS +  '\nFee: $' + fee)){

          let service:APIBuySellService = this.privateService;
          let obs:Observable<VOOrder>
          if(action ==='Sell') obs =  service.sellLimit(base, coin, amountCoin, rate );
          else if(action ==='Buy')obs =  service.buyLimit(base, coin, amountCoin, rate );

          if(!obs) {
            console.error(action);
            return;
          }
          obs.subscribe(res=>{
            if(res && res.uuid){
              this.currentOrder = {
                uuid:res.uuid,
                isOpen:true
              }

              this.checkOrder(res.uuid);

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
