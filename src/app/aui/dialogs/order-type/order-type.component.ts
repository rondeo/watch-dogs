import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef, MatRadioChange} from '@angular/material';
import {VOOrder, WDType} from '../../../amodels/app-models';
import {BotBase} from '../../../app-bots/bot-base';
import {Observable} from 'rxjs/internal/Observable';

@Component({
  selector: 'app-order-type',
  templateUrl: './order-type.component.html',
  styleUrls: ['./order-type.component.scss']
})
export class OrderTypeComponent implements OnInit {

  id: string;
  wdType: WDType;
  amountPots: number;
  entryPrice: number;
  hintEntryPrice: number;
  liquidPrice: number;
  hintLiquidPrice: number;
  openOrders$: Observable<VOOrder[]>;

  constructor(
    public dialogRef: MatDialogRef<OrderTypeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BotBase
  ) { }

  ngOnInit() {
    this.id = this.data.id;
    this.openOrders$ = this.data.bus.ordersOpen$;
    this.data.bus.config$.subscribe(cfg => {
      this.amountPots = cfg.pots;
      this.entryPrice = cfg.entryPrice;
      this.liquidPrice = cfg.liquidPrice;

        const sub = this.data.books$.subscribe(books => {
          if(!books) this.data.apiPublic.downloadBooks2(this.data.config.market).subscribe(books => this.data.books$.next(books));
          else {
            this.hintEntryPrice = books.sell[0].rate;
            this.hintLiquidPrice = books.buy[0].rate;
            setTimeout(() =>sub.unsubscribe(), 50);
          }


        })

    });

    this.data.wdType$.subscribe(type => this.wdType = type);
  }

  onTypeChanged($event: MatRadioChange) {
    this.wdType = $event.value;
  }

  onApplyClick() {

    this.data.bus.saveSettings(this.wdType, +this.amountPots, +this.entryPrice, +this.liquidPrice);
  }

  onCancelOrderClick(order: VOOrder) {

    if(confirm('Cancel Order?')) {
      this.data.apiPrivate.cancelOrder2(order.uuid, order.market).subscribe(res => {
        console.log(res);
        this.data.apiPrivate.refreshAllOpenOrders();
      }, err => {
        this.data.apiPrivate.refreshAllOpenOrders();
      })
    }
  }

  refreshOpenOrders() {
    this.data.apiPrivate.refreshAllOpenOrders();
  }

  onHintLiquidPriceClick() {
    this.liquidPrice = this.hintLiquidPrice;
  }

  onHintEntryPriceClick() {
    this.entryPrice = this.hintEntryPrice
  }
}
