import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {ConnectorApiService} from "../services/connector-api.service";
import {Subscription} from "rxjs/Subscription";



@Component({
  selector: 'app-my-markets',
  templateUrl: './my-markets.component.html',
  styleUrls: ['./my-markets.component.css']
})
export class MyMarketsComponent implements OnInit, OnDestroy {

  constructor(
    private route:ActivatedRoute,
    private apiService:ConnectorApiService
  ) { }

  private sub1:Subscription;
  private sub2:Subscription;
  ngOnInit() {

    this.sub1 = this.apiService.connector$().subscribe(connector=>{
      if(!connector) return;

      console.log(' connector.exchange  ' + connector.exchange);

      connector.loadAllMarketSummaries();


    })

  }

  ngOnDestroy(){
    if(this.sub1) this.sub1.unsubscribe();
    if(this.sub2) this.sub2.unsubscribe();
  }

}
