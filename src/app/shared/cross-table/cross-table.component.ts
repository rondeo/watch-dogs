import { Component, OnInit } from '@angular/core';
import {VOCoin} from '../../models/app-models';

@Component({
  selector: 'app-cross-table',
  templateUrl: './cross-table.component.html',
  styleUrls: ['./cross-table.component.css']
})
export class CrossTableComponent implements OnInit {

  tableHeaders:string[];
  tableBody:string[][];
  coinsAvailable:VOCoin[];

  constructor() { }

  ngOnInit() {
  }

  createSummaryTable(){
    let ar = this.coinsAvailable;

    let tablebody:string[][]=[];
    let headers:string[]= [];
    tablebody[0]=[];
    let i =-1;
    ar.forEach(function (item) {
      headers.push(item.symbol);
      tablebody[++i]=[];
      tablebody[i][0] = item.symbol;

      //tablebody.push(item.symbol);
    });
    this.tableHeaders = headers;
    this.tableBody = tablebody;

  }

}
