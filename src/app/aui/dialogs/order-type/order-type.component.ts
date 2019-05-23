import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef, MatRadioChange} from '@angular/material';
import {WDType} from '../../../amodels/app-models';
import {MarketBot} from '../../../app-bots/market-bot';

@Component({
  selector: 'app-order-type',
  templateUrl: './order-type.component.html',
  styleUrls: ['./order-type.component.scss']
})
export class OrderTypeComponent implements OnInit {

  id: string;
  wdType: WDType;
  amountPots: number;

  constructor(
    public dialogRef: MatDialogRef<OrderTypeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MarketBot
  ) { }

  ngOnInit() {
    this.id = this.data.id;
    this.data.pots$.subscribe(pots => {
      this.amountPots = pots;
    });
    this.data.wdType$.subscribe(type => this.wdType = type);
  }

  onTypeChanged($event: MatRadioChange) {
    this.wdType = $event.value;
  }

  onApplyClick() {
    this.data.wdType = this.wdType;
    this.data.pots$.next(+this.amountPots);
    this.data.saveSettings();
  }
}