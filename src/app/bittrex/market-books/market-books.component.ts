import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {MappersBooks} from "../../com/mappers-books";
import {BittrexService} from "../../exchanges/services/bittrex.service";
import {VOOrderBook} from "../../models/app-models";
import {MatSnackBar} from "@angular/material";

@Component({
  selector: 'app-market-books',
  templateUrl: './market-books.component.html',
  styleUrls: ['./market-books.component.css']
})
export class MarketBooksComponent implements OnInit, OnChanges {



  amountUS:number;
  buyUS:number;
  sellUS:number;


  @Input() base:string;
  @Input() coin:string;
  @Input() priceCoin:number;
  @Input() amountCoin:number;

  @Output() priceSell = new EventEmitter();
  @Output() priceBuy = new EventEmitter();

  private orderBookBuy:VOOrderBook[];
  private orderBookSell:VOOrderBook[];

  private isOrderBookLoading:boolean;


  constructor(
    private publicService:BittrexService,
    private snackBar:MatSnackBar
  ) { }


  ngOnInit() {

  }


  ngOnChanges(changes: SimpleChanges){

    console.log(changes);

    if(changes.coin || changes.base){
      if(this.coin && this.base){

        this.downloadBooks();
      }
    }
    if(changes.amountBase){
      if(!this.orderBookSell)this.downloadBooks();
      else this.setPrice();
    }
  }

  setPrice(){


  }

  downloadBooks(){

    if(!this.base || !this.coin) return;

    this.isOrderBookLoading = true;

    this.publicService.getOrderBook(this.base, this.coin).map(res=>{
      this.isOrderBookLoading = false;
      this.orderBookBuy = res.buy;
      this.orderBookSell = res.sell;

      this.setPrice();

     // this.orderBookBuy = MappersBooks.compileBooks(res.buy, price);
      //this.orderBookSell =  MappersBooks.compileBooks(res.sell, price);//res.sell.slice(0, 20);

      //if(this.transfer.action ==='Sell') this.transfer.rate = this.orderBookBuy[0].Rate;
      //if(this.transfer.action ==='Buy') this.transfer.rate = this.orderBookSell[0].Rate;

    }).toPromise().catch(err=>{
      this.isOrderBookLoading = false;
      this.snackBar.open('Communication error', 'x', {duration:3000, extraClasses:'alert-red'});
    });


  }


}
