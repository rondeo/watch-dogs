import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {VOOrder} from "../../models/app-models";

@Component({
  selector: 'my-orders-history',
  templateUrl: './my-orders-history.component.html',
  styleUrls: ['./my-orders-history.component.css']
})
export class MyOrdersHistoryComponent implements OnInit {

  @Input() addOrder:VOOrder;

  @Input() market:string;

  @Output() onOrderCopmlete:EventEmitter<VOOrder> = new EventEmitter<VOOrder>();

  @Output() onOrderCanceled:EventEmitter<VOOrder> = new EventEmitter<VOOrder>();


  constructor(

  ) { }

  ngOnInit() {
  }

}
