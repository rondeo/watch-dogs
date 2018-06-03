import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {VOMarketCap} from '../../models/app-models';
import * as _ from 'lodash';
import {Router} from "@angular/router";

@Component({
  selector: 'app-sortable-table',
  templateUrl: './sortable-table.component.html',
  styleUrls: ['./sortable-table.component.css']
})
export class SortableTableComponent implements OnInit {

 // markets:{[symbol:string]:VOExchangeData};

  sortCriteria:string = 'rank';
  asc_desc='asc';

  @Input() consAvailable;

  @Output() selectedSymbol:EventEmitter<string> = new EventEmitter();
  constructor(
    private router:Router
  ) { }

  ngOnInit() {
  }


  private sortData(){
    this.consAvailable = _.orderBy(this.consAvailable, this.sortCriteria, this.asc_desc);
  }

  onSymbolClick(event){
    this.selectedSymbol.emit(event);
  }


  onClickHeader(criteria:string):void{
    //console.log(criteria);
    if(this.sortCriteria === criteria){
      if(this.asc_desc === 'asc') this.asc_desc ='desc';
      else  this.asc_desc='asc';
    }else this.asc_desc = 'asc';
   // console.log(this.asc_desc);

    this.sortCriteria = criteria;
    this.sortData();
  }


}
