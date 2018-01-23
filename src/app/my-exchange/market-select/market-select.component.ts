import {Component, Input, OnChanges, OnDestroy, OnInit, Output} from '@angular/core';
import {ConnectorApiService} from "../services/connector-api.service";
import {ApiBase} from "../services/api-base";
import {Subscription} from "rxjs/Subscription";
import {ActivatedRoute, Router} from "@angular/router";
import {VOMarket} from "../../models/app-models";

@Component({
  selector: 'app-market-select',
  templateUrl: './market-select.component.html',
  styleUrls: ['./market-select.component.css']
})
export class MarketSelectComponent implements OnInit, OnChanges, OnDestroy {

  @Input() market:string;

  @Output() currentMarket:string;

  pair:string;

  markets:VOMarket[];
  currentAPI:ApiBase;
  constructor(
    private apiService:ConnectorApiService,
    private route:ActivatedRoute,
    private router:Router
  ) { }

  ngOnInit() {

    this.sub1 = this.route.params.subscribe(params=>{
      this.pair = params.market;
      this.setMarket();
    });
    this.apiService.connector$().subscribe(s=>{

      this.currentAPI = s;
    })
  }

  ngOnChanges(changes){
    if(changes.market){

    }
  }


  setMarket(){
    if(!this.pair && this.pair.indexOf('_') ===-1) return;
    this.currentMarket = this.pair;
  }
  private sub1:Subscription;
  private sub2:Subscription;
  private subMarkets:Subscription;

  ngOnDestroy(){
    if(this.sub1) this.sub1.unsubscribe();
    if(this.sub2) this.sub2.unsubscribe();
  }


  onMarketClick(){

    let sub = this.currentAPI.marketsAr$().subscribe(markets=>{
      console.log(markets)
      if(!markets) return;
      this.markets = markets.filter(function (item) {
        return item.selected;
      })
      setTimeout(()=>sub.unsubscribe(),100);
    })
  }



  onMarketSelected(evt:{value:string}){
    this.markets = null;
    this.router.navigate(['../'+evt.value], {relativeTo: this.route});
  }

}
