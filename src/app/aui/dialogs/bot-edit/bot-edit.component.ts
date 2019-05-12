import {Component, Inject, OnInit} from '@angular/core';
import {MarketBot} from '../../../a-core/app-services/app-bots-services/market-bot';
import {MAT_DIALOG_DATA, MatDialogRef, MatRadioChange} from '@angular/material';
import {Observable} from 'rxjs/internal/Observable';
import {MATH} from '../../../acom/math';
import {WDType} from '../../../amodels/app-models';

@Component({
  selector: 'app-bot-edit',
  templateUrl: './bot-edit.component.html',
  styleUrls: ['./bot-edit.component.scss']
})
export class BotEditComponent implements OnInit {

  base: string;
  coin: string;
  balanceBase: number;
  balanceCoin: number;
  amountPots: number;
  WDType: WDType;
  price = 0;
  stopLoss = 0;
  stopLossPercent = 2;
  bookBuy$: Observable<number>;
  bookSell$: Observable<number>;
  action: string;

  constructor(
    public dialogRef: MatDialogRef<BotEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MarketBot
  ) {
    this.bookBuy$ = data.bookBuy$;
    this.bookSell$ = data.bookSell$;
    console.log(data.wdType$.getValue())


  }

  ngOnInit() {
    // this.data.WDType$.subscribe(type => this.WDType = type);
    this.base = this.data.base;
    this.coin = this.data.coin;
    this.data.balanceBase$.subscribe(balance => {
      this.balanceBase = balance.balance;
    });
    this.data.balanceCoin$.subscribe(balance => {
      this.balanceCoin = balance.balance;
    });
    this.data.pots$.subscribe(pots => {
      if(this.amountPots !== pots) this.amountPots = pots;
    });
  }



  onPotsChanged() {
    const pots = this.data.pots$.getValue();
    if(this.amountPots > pots) this.action = 'BUY';
    else if(this.amountPots < pots) this.action = 'SELL';
    else this.action = 'NONE';
  }


  onAmountChanged() {
    this.calculateStopSell();
  }

  onPriceChanged() {
    this.calculateStopSell();
  }

  calculateStopSell(){
    const num = this.price - (this.price * (this.stopLossPercent/100));
    this.stopLoss = MATH.toPrecision(num, 4)
  }
  onStopLossPercentChanged() {
    this.calculateStopSell();
  }

  onPriceBuyClick() {
    this.price = this.data.bookBuy$.getValue();
    this.calculateStopSell();

  }

  onRefreshBooksClick() {
    this.data.downloadBooks();
  }

  onPriceSellClick() {
    this.price = this.data.bookSell$.getValue();
    this.calculateStopSell();
  }

  onSaveClick() {
    this.data.wdType$.next(this.WDType);
    this.data.pots$.next(this.amountPots);
    // this.dialogRef.close(this.amountPots);
  }


  onBuyClick() {
    const pots = +this.amountPots;
    let price = +this.price;
    const stopLoss = this.stopLoss;
    if(isNaN(price) || isNaN(pots)) return;
    this.data.setBuyOrder(price, pots, +this.stopLoss);
  }

  onSellClick() {
    const pots = this.amountPots;
    const price = +this.price;
    if(isNaN(price) || isNaN(pots)) return;
    const amountCoin = pots * this.data.potSize;

    this.data.setSellOrder(price, pots, this.stopLoss);
  }

  onTypeChanged($event: MatRadioChange) {
    this.WDType = $event.value;
    console.log(this.WDType)
  }
}
