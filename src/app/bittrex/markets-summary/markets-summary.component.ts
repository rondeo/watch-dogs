import {Component, EventEmitter, Inject, Input, OnInit, Output} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {VOMarketB} from '../../models/app-models';

@Component({
  selector: 'app-markets-summary',
  templateUrl: './markets-summary.component.html',
  styleUrls: ['./markets-summary.component.css']
})
export class MarketsSummaryComponent implements OnInit {

  @Input() title:string = 'Markets';
  @Input() markets:VOMarketB[];

  @Output() market:EventEmitter<VOMarketB> = new EventEmitter();


  constructor(

  ) {
   // this.markets = data;

  }

  ngOnInit() {

  }

  onMarketClick(market){

    this.market.emit(market);
  }

}
