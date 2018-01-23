import {Component, OnDestroy, OnInit} from '@angular/core';
import {ConnectorApiService} from "../services/connector-api.service";
import {VOBalance, VOTransfer} from "../../models/app-models";
import {MarketCapService} from "../../market-cap/market-cap.service";
import {Router} from "@angular/router";
import {MatDialog, MatSnackBar} from "@angular/material";
import {ApiBase} from "../services/api-base";


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

    console.log(this.apiService.getExchangeName())
    this.sub1 = this.apiService.connector$().subscribe(connector => {
      this.currentConnector = connector;
      if (!connector) return;

      this.sub2 =  connector.balances$().subscribe(res=>{
        console.log ('balances res', res);
        if(!res) return;
        this.data = res.filter(function (item) {
          return !!item.id;
        });

        this.render();


      });
      connector.isLogedIn$().subscribe(logedIn => {
        connector.loadBalances();

      })

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

  onShowAll(evt){
    this.isShowAll = evt.checked;
    this.render()
  }


  refreshBalance(){
    if(this.currentConnector) this.currentConnector.refreshBalances();
  }


}
