import { Component, OnInit } from '@angular/core';
import {MarketCapService} from '../market-cap.service';
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

    //this.service.timestamp$.subscribe(res=>{
     // this.time = moment(res).format('ddd DD, h:mm a')
    //})
  }

  onRefreshClick(){
    this.service.refresh();
  }

}
