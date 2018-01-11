import { Component, OnInit } from '@angular/core';
import {VOOrder} from "../../models/app-models";
import {BittrexPrivateService} from "../bittrex-private.service";
import {MatSnackBar} from "@angular/material";

@Component({
  selector: 'app-open-orders',
  templateUrl: './open-orders.component.html',
  styleUrls: ['./open-orders.component.css']
})
export class OpenOrdersComponent implements OnInit {

  openOrders:VOOrder[];
  constructor(
    private privateService:BittrexPrivateService,
    private snackBar:MatSnackBar,
  ) { }

  ngOnInit() {
    this.getOpenOrders();
  }

  onCancelOrderClick(order: VOOrder) {
   /* if(!confirm('You want to cancel order? \n '+order.OrderUuid +' \n '+order.Exchange + ' '+order.Quantity +' '+order.Limit)) return;

      this.privateService.cancelOrder(order.OrderUuid).subscribe(res=>{
        if(res){
          //this.privateService.deleteTransferById(order.OrderUuid);
          this.snackBar.open('Order Canceled!','x');
        }
        if(res.message ==='ORDER_NOT_OPEN'){
         // this.privateService.deleteTransferById(order.OrderUuid);
        }
        console.log(res);

      });*/


  }

  getOpenOrders(){
  /*  let sub = this.privateService.getOpenOrders(null).subscribe(res=>{
      console.log(res);
      sub.unsubscribe();

    })*/
  }




}
