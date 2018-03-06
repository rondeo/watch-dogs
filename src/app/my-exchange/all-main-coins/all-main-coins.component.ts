import { Component, OnInit } from '@angular/core';
import {ConnectorApiService} from "../services/connector-api.service";
import {ActivatedRoute} from "@angular/router";
import {ChannelEvents, Channels} from "../services/apis/socket-models";


@Component({
  selector: 'all-main-coins',
  templateUrl: './all-main-coins.component.html',
  styleUrls: ['./all-main-coins.component.css']
})
export class AllMainCoinsComponent implements OnInit {


  constructor(
    private connector:ConnectorApiService,
    private route:ActivatedRoute
  ) { }

  ngOnInit() {

    this.route.params.subscribe(params=>{
      console.log(params);
    });

    /*this.connector.bitfinex.downloadTrades('USDT', 'BTC').subscribe(res=>{
      console.log(res);
    })*/


  }


}
