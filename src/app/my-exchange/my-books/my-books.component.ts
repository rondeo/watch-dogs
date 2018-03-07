import {Component, Input, Output, OnChanges, OnDestroy, OnInit, EventEmitter} from '@angular/core';
import {ApiBase} from "../services/apis/api-base";
import {ConnectorApiService} from "../services/connector-api.service";
import {BooksService} from "../../services/books-service";
import {VOBooks} from "../../models/app-models";



@Component({
  selector: 'app-my-books',
  templateUrl: './my-books.component.html',
  styleUrls: ['./my-books.component.css']
})
export class MyBooksComponent implements OnInit, OnChanges, OnDestroy {

  currentAPI:ApiBase;

  @Input() amountBase:number;
  @Input() refresh:number;
  @Input() marketInit:{base:string, coin:string, exchange:string, priceBaseUS:number, market:string};


  percentDiff:number;
  isLoading:boolean;

  sellColor:string;
  buyColor:string;

  sellChange:number;
  buyChange:number;


  isError:boolean

  @Output() rateForAmount:EventEmitter<{
    amountBase:number,
    rateToBuy:number,
    rateToSell:number
  }> = new EventEmitter<{amountBase: number, rateToBuy: number, rateToSell: number}>();

  rateToSellUS:number;
  rateToBuyUS:number;

 /* @Output() rateToSellUSEmit:EventEmitter<number> = new EventEmitter();
  @Output() rateToBuyUSEmit:EventEmitter<number> = new EventEmitter();*/


  private books:VOBooks;


  constructor(
    private apiService:ConnectorApiService,
  ) {

  }

  onRateChanged(evt){

    this.percentDiff = +(100 * (this.rateToBuyUS - this.rateToSellUS)/this.rateToBuyUS).toFixed(2);
  }

  isRateToSell = false;
  onRateToSellClick(){
    this.isRateToSell = !this.isRateToSell
  }

  isRateToBuy = false;
  onRateToBuyClick(){
    this.isRateToBuy = !this.isRateToBuy;

  }


  onRateToSellFocus(){
    this.isLoading = false;
  }

  onRateToBuyFocus(){
    this.isLoading = false;
  }

  ngOnDestroy(){
    if(this.sub1) this.sub1.unsubscribe();
    if(this.sub2) this.sub2.unsubscribe();
  }
  private sub1;
  private sub2;

  ngOnInit() {
    this.sub1 = this.apiService.connector$().subscribe(connector => {
      this.currentAPI = connector;
      if (!connector) return;
      this.downloadBooks();
    },err=>{
      this.isError = true;
    });

  }

  ngOnChanges(changes){

   // console.warn(changes);
    if(changes.refresh){
      this.downloadBooks((err, res)=>{ });
    }

    if(changes.marketInit && changes.marketInit.currentValue) {


      this.downloadBooks((err, res)=>{ });
    }

    if(changes.amountBase){

      this.calculateBooks();
    }

  }

  calculateBooks(){
    //console.log(this.amountBase, !this.books, this.marketInit);


    if(!this.amountBase || !this.books || !this.marketInit) return;
    //let amountBase = this.amountBaseUS / this.priceBaseUS;

    let priceBaseUS = this.marketInit.priceBaseUS;

    //console.log(this.books);

    let rateBuy =  BooksService.getRateForAmountBase(this.books.buy, this.amountBase);
    let rateSell = BooksService.getRateForAmountBase(this.books.sell, this.amountBase);

   // console.log('rateBuy '+ rateBuy);
   // console.log('rateSell '+ rateSell);

    let rateToSellUS = +(rateBuy * priceBaseUS).toPrecision(4);
    let rateToBuyUS = +(rateSell * priceBaseUS).toPrecision(4);


   // let oldBooks = this.rateByBooks;

    /*if(this.rateToBuyUS){

      this.buyChange = +(100 * (rateToBuyUS - this.rateToBuyUS)/this.rateToBuyUS).toFixed(2);
      if(this.buyChange > 0)this.buyColor = 'green';
      else if(this.buyChange < 0)this.buyColor = 'red';
      else this.buyColor = '';
    }

    if(this.rateToSellUS){

      this.sellChange = +(100 * (rateToSellUS - this.rateToSellUS)/this.rateToSellUS).toFixed(2);
      if(this.sellChange > 0)this.sellColor = 'green';
      else if(this.sellChange < 0)this.sellColor = 'red';
      else this.sellColor = '';
    }*/

    this.rateForAmount.emit( {
      amountBase:this.amountBase,
      rateToBuy:rateSell,
      rateToSell:rateBuy
    });

    this.rateToBuyUS = rateToBuyUS;
    this.rateToSellUS = rateToSellUS;

    this.onRateChanged(null);
  }

  reset(){
    this.rateToBuyUS = 0;
    this.rateToSellUS = 0;
  }

  downloadBooks(callBack?:(err, res)=>void){
    if(!this.marketInit || !this.marketInit.market || !this.currentAPI) return this.reset();

    let cur = this.marketInit;
    if(this.isLoading)  return;

    this.isLoading = true;

    //console.warn('downloadBooks ' + cur.base + ' '+ cur.coin);
   let sub =  this.currentAPI.downloadBooks(cur.base, cur.coin).subscribe(books=>{
     //console.warn(books);

     this.isLoading = false;
     this.isError = false;
     this.books = books;
     this.calculateBooks();
     sub.unsubscribe();
     if(callBack)callBack(null, books)

     }, err => {
     this.isError = true;
     sub.unsubscribe();
     if(callBack)callBack(err, null);
   })

  }
  onRefreshBooksClick(){
    this.downloadBooks((err, res)=>{

    });

  }

}
