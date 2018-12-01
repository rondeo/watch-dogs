import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChange, SimpleChanges} from '@angular/core';

@Component({
  selector: 'app-amount-coin',
  templateUrl: './amount-coin.component.html',
  styleUrls: ['./amount-coin.component.css']
})
export class AmountCoinComponent implements OnInit, OnChanges {

  constructor() { }

  @Input() amount: number;
  @Output() amountChanged: EventEmitter<number> = new EventEmitter();

  amountUS = 100;

  ngOnInit() {
  }

  ngOnChanges(evt: SimpleChanges) {
    if (evt.amount) {
      const newAmount = evt.amount.currentValue;
      if (newAmount !== this.amountUS) this.amountUS = newAmount;
    }
  }

  onAmountChanged(evt) {
    const amount  = evt.value;
    this.amountChanged.emit(amount);
  }

}
