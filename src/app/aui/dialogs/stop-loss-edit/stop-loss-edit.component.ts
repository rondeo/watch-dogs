import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';


import {VOOrder, VOWatchdog} from '../../../amodels/app-models';
import {STOP_LOSS_DEFAULT, StopLossAuto, StopLossSettings} from '../../../app-bots/stop-loss-auto';
import {BotBase, MyOrder} from '../../../app-bots/bot-base';
import {FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {Observable} from 'rxjs/internal/Observable';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';
import {UTILS} from '../../../acom/utils';
import {cancelOrders} from '../../../app-bots/controllers/cancel-orders';


@Component({
  selector: 'app-stop-loss-edit',
  templateUrl: './stop-loss-edit.component.html',
  styleUrls: ['./stop-loss-edit.component.scss']
})
export class StopLossEditComponent implements OnInit {

  id: string;
  resetStopLossAt: number;
  //stopLoss: StopLossOrder;

  stopLossPercent: FormControl;
  stopLossPercent$: Observable<number>;
  sellPercent: FormControl;
  sellPercent$: Observable<number>;
  stopLossOrder: VOOrder = new MyOrder({});
  stopPrice: number;
  sellPrice: number;
  ma$: Observable<{ last: number, ma3: number, ma7: number, ma25: number, ma99: number }>;
  disabled: boolean;

  stopLossConfig: StopLossSettings = STOP_LOSS_DEFAULT;

  constructor(
    public dialogRef: MatDialogRef<StopLossEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BotBase,
    fb: FormBuilder
  ) {

    this.id = data.id;
    data.bus.config$.subscribe(config => {
      this.stopLossConfig = config.stopLoss;
    })
  //  this.stopLoss = data.stopLossController;
    this.stopLossPercent = new FormControl(0);
    this.stopLossPercent$ = this.stopLossPercent.valueChanges;
    this.sellPercent = new FormControl(0);
    this.sellPercent$ = this.sellPercent.valueChanges;

    this.ma$ = data.mas$;

    this.resetStopLossAt = data.config.stopLoss.resetStopLossAt;
    this.disabled =  data.config.stopLoss.disabled;

    data.bus.mas$.subscribe(mas => {
      if (mas) this.onStopPercentChange();
    });

    data.bus.stopLossOrders$.subscribe(orders => this.stopLossOrder = orders.length?orders[0]:new MyOrder({}));
  }

  ngOnInit() {

    combineLatest(this.stopLossPercent$, this.sellPercent$, this.data.mas$)
      .subscribe(([stopLossPercent, sellPercent, mas]) => {
        const prices = StopLossAuto.getStopLossPrices(mas, stopLossPercent, sellPercent);
        this.stopPrice = prices.stopPrice;
        this.sellPrice = prices.sellPrice;
      });

    setTimeout(() => {
      this.stopLossPercent.setValue(this.data.config.stopLoss.stopLossPercent, {emitEvent: true});
      this.sellPercent.setValue(this.data.config.stopLoss.sellPercent, {emitEvent: true});
    }, 1000);

  }

  onApplyClick() {

    const wd: VOWatchdog = this.data.bus.config$.getValue();

    wd.stopLoss =  Object.assign( wd.stopLoss,{ stopLossPercent:this.stopLossPercent.value,
      sellPercent: this.sellPercent.value,
      disabled: this.disabled,
      resetStopLossAt: this.resetStopLossAt
    } );
    this.data.bus.config$.next(wd);
  }

  onDeleteOrderClick(order: VOOrder) {

    if (confirm('Cancel Order? ' + order.uuid)) {
      cancelOrders([order], this.data.apiPrivate, this.data.bus)

    }
  }


  onStopPercentChange() {

    /*const prices = StopLossOrder.getStopLossPrices(mas, this.stopLossPercent, this.sellPercent);
    this.stopPrice = prices.stopPrice;
    this.sellPrice = prices.sellPrice;*/
  }

  onSellPercentChange() {
    // this.sellPrice = StopLossOrder.getSellPrice(this.stopPrice, this.sellPercent);
  }

  onRefreshClick() {
    this.data.refreshOpenOrders();
  }

  sendStopLoss() {

    console.log(this.data);
   /* const balance = this.data.balanceCoin;
    const available = balance.available;
    const market = this.data.market;

    this.data.apiPrivate.stopLoss(market, available, this.stopPrice, this.sellPrice).then(res => {
      console.log(res);

    })*/


    /* this.stopLoss.setStopLoss(available, this.stopPrice, this.sellPrice).then(res => {
       console.log(res);
     })*/
  }
}
