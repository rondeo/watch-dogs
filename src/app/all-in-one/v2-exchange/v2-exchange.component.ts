import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {V2Service} from "../v2.service";
import {VOMarket} from "../../models/app-models";

@Component({
  selector: 'app-v2-exchange',
  templateUrl: './v2-exchange.component.html',
  styleUrls: ['./v2-exchange.component.css']
})
export class V2ExchangeComponent implements OnInit, OnDestroy {

  exchange:string;
  marketsAr:VOMarket[];
  searchWord:string;
  searchTopic:string;

  private sub1;
  private sub2;
  constructor(
    private router:Router,
    private route:ActivatedRoute,
    private allV2Service:V2Service
  ) { }

  ngOnDestroy(){
    this.sub1.unsubscribe();
    this.sub2.unsubscribe();
  }
  ngOnInit() {

   this.sub1 =  this.allV2Service.serchResult$.subscribe(markets=>{

      if(!markets) return;
      this.searchWord = this.allV2Service.searchWord;
      this.searchTopic = this.allV2Service.searchTopic;
     console.log(' markets : ' +markets.length);
      this.marketsAr = markets;
    });

    this.sub2 = this.route.params.subscribe(params=>{
      this.exchange = params.exchange;

      if(this.exchange)this.allV2Service.searchMarketsByExchange(this.exchange)


    });

  }

  onMarketClick(market:VOMarket){
    console.log(market)
  };


  onMarketGraphClick(market:VOMarket){

    let url = this.allV2Service.getMarketUrl(market);
    url = url.replace('{{base}}', market.base).replace('{{coin}}', market.coin);
    console.log(url);
    window.open(url, '_blank');

  }

  onSortClick(creteria){
     this.allV2Service.sortResultBy(creteria);
  }

}
