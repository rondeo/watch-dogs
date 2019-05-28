import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';


import {VOOrder} from '../../../amodels/app-models';
import {StopLossOrder} from '../../../app-bots/stop-loss-order';
import {MyOrder} from '../../../app-bots/bot-base';
import {MarketBot} from '../../../app-bots/market-bot';


@Component({
  selector: 'app-stop-loss-edit',
  templateUrl: './stop-loss-edit.component.html',
  styleUrls: ['./stop-loss-edit.component.scss']
})
export class StopLossEditComponent implements OnInit {

  id: string;
  resetStopLossAt: number;
  stopLoss: StopLossOrder;
  stopLossPercent: number;
  sellPercent: number;
  stopLossOrder: VOOrder = new MyOrder({});
  stopPrice: number;
  sellPrice: number;
  ma: number;
  disabled: boolean;


  constructor(
    public dialogRef: MatDialogRef<StopLossEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MarketBot
  ) {
    this.id = data.id;
    this.stopLoss = data.stopLossController;

    this.stopLossPercent = this.stopLoss.stopLossPercent;
    this.sellPercent = this.stopLoss.sellPercent;
    this.resetStopLossAt = this.stopLoss.resetStopLossAt;
    this.disabled = this.stopLoss.disabled;
    data.bus.mas$.subscribe(mas => {
      if (mas) this.onStopPercentChange();
    });
    data.stopLossOrder$.subscribe(order => this.stopLossOrder = (order || new MyOrder({})))
  }

  ngOnInit() {

  }

  onApplyClick() {
    this.stopLoss.sellPercent = this.sellPercent;
    this.stopLoss.stopLossPercent = this.stopLossPercent;
    this.stopLoss.resetStopLossAt = this.resetStopLossAt;
    this.stopLoss.disabled = this.disabled;
    this.stopLoss.save();

    //  this.dialogRef.close('SAVE');
  }

  onDeleteOrderClick(uuid: string) {

    if (confirm('Cancel Order? ' + uuid)) this.stopLoss.cancelOrder(uuid);
  }

  onStopPercentChange() {
    const mas = this.data.mas$.getValue();
    const prices = StopLossOrder.getStopLossPrices(mas, this.stopLossPercent, this.sellPercent);
    this.stopPrice = prices.stopPrice;
    this.sellPrice = prices.sellPrice;
  }

  onSellPercentChange() {
    this.sellPrice = StopLossOrder.getSellPrice(this.stopPrice, this.sellPercent);
  }

  onRefreshClick() {
    this.data.refreshOpenOrders();
  }

  sendStopLoss() {

    console.log(this.data);
    const balance = this.data.balanceCoin;
    const available = balance.available;
    const market = this.data.market;

    this.data.apiPrivate.stopLoss(market, available, this.stopPrice, this.sellPrice).then(res => {
      console.log(res);

    })


   /* this.stopLoss.setStopLoss(available, this.stopPrice, this.sellPrice).then(res => {
      console.log(res);
    })*/
  }
}
