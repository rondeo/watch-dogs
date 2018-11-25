import { Component, OnInit } from '@angular/core';
import {ScanMarketsService} from '../../app-services/scanner/scan-markets.service';

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.component.html',
  styleUrls: ['./scanner.component.css']
})
export class ScannerComponent implements OnInit {
  constructor(
    public scanMarkets: ScanMarketsService
  ) { }

  ngOnInit() {
    // this.scanMarkets.start();
  }

}
