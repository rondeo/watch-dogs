import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {VOMarketB} from '../../models/app-models';


@Component({
  selector: 'app-markets-summary-dialog',
  templateUrl: './markets-summary.component.html',
  styleUrls: ['./markets-summary.component.css']
})
export class MarketsSummaryDialog implements OnInit {

  markets:VOMarketB[];
  title:string = 'Markets';



  constructor(
    @Inject(MAT_DIALOG_DATA) private data: VOMarketB[],
    private dialogRef: MatDialogRef<any>
  ) {
    this.markets = data;
  }

  ngOnInit() {

  }

  onMarketClick(market){

    //this.market.emit(market);
  }


}
