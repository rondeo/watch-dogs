import {Component, Input, OnChanges, OnDestroy, OnInit} from '@angular/core';
import {VOOrder} from "../../models/app-models";
import {BittrexPrivateService} from "../bittrex-private.service";
import * as _ from 'lodash';

@Component({
  selector: 'app-orders-history',
  templateUrl: './orders-history.component.html',
  styleUrls: ['./orders-history.component.css']
})
export class OrdersHistoryComponent implements OnInit, OnDestroy, OnChanges {

  history:VOOrder[];
  allHistory:VOOrder[]
  @Input() basePrice:number;
  @Input() market:string;
  @Input() symbol:string;

  constructor(
    private privateService:BittrexPrivateService
  ) { }


  ngOnChanges(changes){
    if(changes.symbol){
      this.filterHistoryBySymbol();
    }
  }
  private sub1;
  ngOnInit() {

    this.sub1 = this.privateService.getHistory().subscribe(res=>{
      this.allHistory = res;
      if(this.symbol) this.filterHistoryBySymbol();
      console.log(res);
    });
  }

  ngOnDestroy(){
    this.sub1.unsubscribe();
  }

  private filterHistoryBySymbol(){
    let symbol = this.symbol;
    if(!symbol || !this.allHistory) return;
    this.history = this.allHistory.filter(function (item) {
      return item.base == symbol || item.coin === symbol;

    })

    //console.log(this.history);
    //let f = _.first(this.history);
    //console.log(f.amountBase * f.priceBaseUS)
  }


}
