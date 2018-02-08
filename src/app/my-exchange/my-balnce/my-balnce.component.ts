import {Component, OnDestroy, OnInit} from '@angular/core';
import {ConnectorApiService} from "../services/connector-api.service";
import {VOBalance, VOTransfer} from "../../models/app-models";
import {MarketCapService} from "../../market-cap/market-cap.service";
import {Router} from "@angular/router";
import {MatDialog, MatSnackBar} from "@angular/material";
import {ApiBase} from "../services/api-base";
import * as _ from 'lodash';

@Component({
  selector: 'app-my-balnce',
  templateUrl: './my-balnce.component.html',
  styleUrls: ['./my-balnce.component.css']
})
export class MyBalnceComponent implements OnInit, OnDestroy {


  balancesAr:VOBalance[];
  data:VOBalance[];
  total:string;
  transfers:VOTransfer[];


  isPendingOrders:boolean;
  MC;

  currentConnector:ApiBase;

  constructor(
    private apiService:ConnectorApiService,
    private dialog:MatDialog,
    private router:Router,
    private snackBar:MatSnackBar,
    private marketCap:MarketCapService
  ) { }


  ngOnDestroy(){
    if(this.sub1) this.sub1.unsubscribe();
    if(this.sub2) this.sub2.unsubscribe();
  }

  private sub1;
  private sub2;
  ngOnInit() {


    this.sub1 = this.apiService.connector$().subscribe(connector => {
      this.currentConnector = connector;
      if (!connector) return;

      if(this.sub2)this.sub2.unsubscribe();

      this.sub2 =  connector.balances$().subscribe(res=>{
        this.isBalancesLoading = false;
        if(!res) return;
        this.data = res.filter(function (item) {
          return !!item.id;
        });

        this.render();
      });

      /*connector.isLogedIn$().subscribe(logedIn => {
        connector.

      })*/

    });

  }

  isShowAll:boolean;
  private render(){

    let ar:VOBalance[];

    if(this.isShowAll){
      ar = this.data;
    }else  ar = this.data.filter(function (item) {
      return +item.balance !==0;
    });

    this.total  = ar.reduce(function (a, b) {  return a+ +b.balanceUS; },0).toFixed(2);
    this.balancesAr = ar.sort(function (a, b) { return +a.balanceUS > +b.balanceUS?-1:1; });
  }

  sortByBalance(){

    if(this.sortBy === 'balanceUS') {
      this.asc_desc = (this.asc_desc === 'asc')?'desc':'asc';
    }
    this.sortBy = 'balanceUS';
    this.balancesAr = _.orderBy(this.balancesAr,'balanceUS', this.asc_desc);//.sort(function (a, b) { return +a.balanceUS > +b.balanceUS?-1:1; });
  }
  onShowAll(evt){
    this.isShowAll = evt.checked;
    this.render()
  }


  isBalancesLoading= false
  refreshBalance(){
    if(this.currentConnector) {
      this.isBalancesLoading = true;
      this.currentConnector.refreshBalances();
    }
  }

  sortBy:string;
  asc_desc = 'desc';

  onSortClick(criteria:string):void{
    console.log(criteria);

    if(this.sortBy === criteria) {
      this.asc_desc = (this.asc_desc === 'asc')?'desc':'asc';
    }

    this.sortBy = criteria;
    this.sortData();
  }

  sortData(){

    this.balancesAr = _.orderBy(this.balancesAr, this.sortBy, this.asc_desc);

    // console.log(sorted);

  }

}
