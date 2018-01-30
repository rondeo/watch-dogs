import {Component, Input, Output, OnChanges, OnDestroy, OnInit, EventEmitter} from '@angular/core';
import {ApiBase, VOBooks} from "../services/api-base";
import {ConnectorApiService} from "../services/connector-api.service";
import {BooksService} from "../../services/books-service";


@Component({
  selector: 'app-my-books',
  templateUrl: './my-books.component.html',
  styleUrls: ['./my-books.component.css']
})
export class MyBooksComponent implements OnInit, OnChanges, OnDestroy {

  currentAPI:ApiBase;

  @Input() amountBase:number;
/*  @Input() amountCoin:number;*/
  //@Input() market:string;
  //@Input() priceBaseUS:number;
  @Input() refresh:number;

  @Input() marketInit:{base:string, coin:string, exchange:string, priceBaseUS:number, pair:string};


  percentDiff:number;
  isLoading:boolean;
  bookingColor:string;
  sellColor:string;
  buyColor:string;

  sellChange:number;
  buyChange:number;
 // base:string;
 // coin:string;

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
     // if(this.sub2) this.sub2.unsubscribe();
     /* this.sub2 = connector.books$().subscribe(books=>{
        console.log(books);
        this.bookingColor = '';
        this.isBooksLoading = false;
        this.isError = false;
        this.books = books;
        this.calculateBooks();

      })*/
     // this.downloadBooks();
    },err=>{
      this.isError = true;
     // this.bookingColor = 'red';
     // this.isBooksLoading = false;
    });

  }

  ngOnChanges(changes){
    if(changes.refresh){
      this.downloadBooks((err, res)=>{ });
    }

    if(changes.marketInit) {
      console.log(changes.market);
      this.downloadBooks((err, res)=>{ });
      /*  let a = this.market.split('_');
        if(a.length === 2){
          this.base = a[0];
          this.coin = a[1];
          this.downloadBooks();
        }else{
          this.base = null;
          this.coin = null;
        }
      }

      if(changes.priceBaseUS){
        if(this.priceBaseUS) this.calculateBooks();
      }*/
    }

    if(changes.amountBase){
      this.calculateBooks();
    }

  }

  calculateBooks(){
    //console.log(this.amountBase, !this.books, this.marketInit.priceBaseUS);


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

    this.percentDiff = +(100 * (rateToBuyUS - rateToSellUS)/rateToBuyUS).toFixed(2);
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

  }

  reset(){
    this.rateToBuyUS = 0;
    this.rateToSellUS = 0;
  }

  downloadBooks(callBack:(err, res)=>void){
    if(!this.marketInit) return this.reset();

    let cur = this.marketInit;
    if(this.isLoading)  return;

    this.isLoading = true;
    //console.warn('downloadBooks ' + cur.base + ' '+ cur.coin);
   let sub =  this.currentAPI.downloadBooks(cur.base, cur.coin).subscribe(books=>{
    // console.warn(books);
     this.bookingColor = '';
     this.isLoading = false;
     this.isError = false;
     this.books = books;
     this.calculateBooks();
     sub.unsubscribe();
     callBack(null, books)

     }, err => {
     this.isError = true;
     sub.unsubscribe();
     callBack(err, null);
   })

  }
  onRefreshBooksClick(){
    this.downloadBooks((err, res)=>{

    });

  }

}
