import { Component, OnInit } from '@angular/core';
import {MarketCapService} from '../services/market-cap.service';
import * as moment from 'moment';

@Component({
  selector: 'app-market-cap-main',
  templateUrl: './market-cap-main.component.html',
  styleUrls: ['./market-cap-main.component.css']
})
export class MarketCapMainComponent implements OnInit {

  time:string;
  constructor(
    private service:MarketCapService
  ) { }

  ngOnInit() {

  }

  onRefreshClick(){
   //  this.service.refresh();
  }

}
