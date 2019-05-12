import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {MarketBot} from '../../../a-core/app-services/app-bots-services/market-bot';
import {StopLossOrder} from '../../../a-core/app-services/app-bots-services/stop-loss-order';
import {VOOrder} from '../../../amodels/app-models';
import {MyOrder} from '../../../a-core/app-services/app-bots-services/bot-base';

@Component({
  selector: 'app-stop-loss-edit',
  templateUrl: './stop-loss-edit.component.html',
  styleUrls: ['./stop-loss-edit.component.scss']
})
export class StopLossEditComponent implements OnInit {

  stopLoss: StopLossOrder;
  stopLossPercent: number;
  sellPercent: number;
  stopLossOrder: VOOrder = new MyOrder({});
  stopPrice: number;
  sellPrice: number;
  ma: number;

  constructor(
    public dialogRef: MatDialogRef<StopLossEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MarketBot
  ) {
    this.stopLoss = data.stopLossController;
    this.stopLossPercent = this.stopLoss.stopLossPercent;
    this.sellPercent = this.stopLoss.sellPercent;
    this.stopLoss.ma$.subscribe(ma => {
      if(ma) this.onStopPercentChange();
    });
    this.stopLoss.stopLossOrder$.subscribe(order => {
      this.stopLossOrder = order;
    })
  }

  ngOnInit() {

  }

  onApplyClick() {
    this.stopLoss.sellPercent = this.sellPercent;
    this.stopLoss.stopLossPercent = this.stopLossPercent;
    this.stopLoss.save();
   //  this.dialogRef.close('SAVE');
  }

  onDeleteOrderClick(uuid : string) {
    if(confirm('Cancel Order? ')) this.stopLoss.cancelOrder(uuid);
  }

  onStopPercentChange() {
    const ma = this.stopLoss.ma$.getValue();
    this.stopPrice = +(ma+ (ma * (this.stopLossPercent/100))).toPrecision(6);
    this.onSellPercentChange();
  }


  onSellPercentChange() {
    this.sellPrice = +(this.stopPrice + (this.stopPrice * (this.sellPercent / 100))).toPrecision(6);

  }
}
