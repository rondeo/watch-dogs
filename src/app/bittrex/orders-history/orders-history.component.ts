import {Component, OnDestroy, OnInit} from '@angular/core';
import {VOOrder} from "../../models/app-models";
import {BittrexPrivateService} from "../bittrex-private.service";

@Component({
  selector: 'app-orders-history',
  templateUrl: './orders-history.component.html',
  styleUrls: ['./orders-history.component.css']
})
export class OrdersHistoryComponent implements OnInit, OnDestroy {

  history:VOOrder[];

  constructor(
    private privateService:BittrexPrivateService
  ) { }

  private sub1
  ngOnInit() {
    this.sub1 = this.privateService.getHistory().subscribe(res=>{
      this.history = res;
      console.log(res);
    });
  }

  ngOnDestroy(){
    this.sub1.unsubscribe();
  }


}
