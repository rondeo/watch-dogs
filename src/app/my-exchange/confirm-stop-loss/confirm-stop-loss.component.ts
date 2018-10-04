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

  constructor(
    private dialogRef: MatDialogRef<{ triggerPrice: string, setPrice: string}>,
    @Inject(MAT_DIALOG_DATA) public data: {rate: number}
  ) {
    let rate = data.rate;
    const l = data.rate.toString().length;
    rate = +(rate - (rate * 0.004)).toString().substr(0, l);
    this.stopPrice = rate;
    this.sellPrice = +(rate - rate * 0.01).toString().substr(0, l);
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
}
