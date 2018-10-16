import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';

@Component({
  selector: 'app-confirm-stop-loss',
  templateUrl: './confirm-stop-loss.component.html',
  styleUrls: ['./confirm-stop-loss.component.css']
})
export class ConfirmStopLossComponent implements OnInit {

  stopPrice: number;
  sellPrice: number;
  fromRate: number;
  msg:string;

  constructor(
    private dialogRef: MatDialogRef<{ triggerPrice: string, setPrice: string}>,
    @Inject(MAT_DIALOG_DATA) public data: {rate: number, msg:string}
  ) {
    this.msg = data.msg;
    let rate = data.rate;
    this.fromRate = data.rate;
    this.setRate(1.2);
  }

  ngOnInit() {

  }

  onConfirmClick(){
    const stopPrice = this.stopPrice;
    const sellPrice = this.sellPrice;
    this.dialogRef.close({stopPrice, sellPrice});

  }

  onCancelClick(){
    this.dialogRef.close();
  }

  onPriceCanage(){
    const rate = this.stopPrice;
    const l = rate.toString().length;
    this.sellPrice = +(rate - rate * 0.01).toString().substr(0, l);

  }
  setRate(percent: number){
    percent = percent/100;
    let rate = this.fromRate;
    const l = rate.toString().length;
    rate = +(rate - (rate * percent)).toString().substr(0, l);
    this.stopPrice = rate;
    this.sellPrice = +(rate - rate * 0.01).toString().substr(0, l);
  }

  onSladerChange(evt){
    this.setRate(evt.value);

  }
}
