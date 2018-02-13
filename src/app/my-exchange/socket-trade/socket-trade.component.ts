import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-socket-trade',
  templateUrl: './socket-trade.component.html',
  styleUrls: ['./socket-trade.component.css']
})
export class SocketTradeComponent implements OnInit {

  constructor(
    private route:ActivatedRoute
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params=>{
     console.log(params);
    });
  }

}
