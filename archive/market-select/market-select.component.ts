import {Component, Input, OnChanges, OnDestroy, OnInit, Output} from '@angular/core';
import {ConnectorApiService} from "../services/connector-api.service";
import {ApiBase} from "../services/apis/api-base";
import {Subscription} from "rxjs/Subscription";
import {ActivatedRoute, Router} from "@angular/router";
import {VOMarket} from "../../src/app/models/app-models";

@Component({
  selector: 'app-market-select',
  templateUrl: './market-select.component.html',
  styleUrls: ['./market-select.component.css']
})
export class MarketSelectComponent implements OnInit, OnDestroy {

  currentValue:string;
  markets:VOMarket[];
  currentAPI:ApiBase;

  constructor(
    private apiService:ConnectorApiService,
    private route:ActivatedRoute,
    private router:Router
  ) { }

  ngOnInit() {

    let sub1 = this.route.params.subscribe(params=>{
      this.currentValue = params.market;
      setTimeout(()=>sub1.unsubscribe(), 200);
    });

    this.apiService.connector$().subscribe(s=>{
      this.currentAPI = s;

      let sub = this.currentAPI.getAllMarkets().subscribe(markets=>{
        if(!markets) return;
        this.markets = markets.filter(function (item) {
          return item.selected;
        });

        setTimeout(()=>sub.unsubscribe(),100);
      })


    })
  }


  ngOnDestroy(){
  }

  onMarketSelected(evt:{value:string}){
    //this.markets = null;
    this.router.navigate(['../'+evt.value], {relativeTo: this.route});
  }

}
