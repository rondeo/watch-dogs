import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";
import {VOMarket} from "../../models/app-models";

@Component({
  selector: 'app-market-view',
  templateUrl: './market-view.component.html',
  styleUrls: ['./market-view.component.css']
})
export class MarketViewComponent implements OnInit {

  markets:VOMarket[];
  constructor(
    @Inject(MAT_DIALOG_DATA) private data: VOMarket[], private dialogRef: MatDialogRef<any>
  ) {

    this.markets = data;
  }

  ngOnInit() {
  }


  onMarketClick(market:VOMarket){
    this.dialogRef.close();
    window.open('https://bittrex.com/Market/Index?MarketName=' + market.pair.replace('_','-'), '_blank');
  }
}
