import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {ConnectorApiService} from "../services/connector-api.service";
import {Subscription} from "rxjs/Subscription";
import {VOMarket} from "../../models/app-models";
import * as _ from 'lodash';
import {ApiBase} from "../services/apis/api-base";


@Component({
  selector: 'app-my-markets',
  templateUrl: './my-markets.component.html',
  styleUrls: ['./my-markets.component.css']
})
export class MyMarketsComponent implements OnInit, OnDestroy {

  marketsAr:VOMarket[];
  marketsArAll:VOMarket[];

  apiConnector:ApiBase;

  constructor(
    private route:ActivatedRoute,
    private apiService:ConnectorApiService
  ) { }

  private sub1:Subscription;
  private sub2:Subscription;
  private subMarkets:Subscription;
  ngOnInit() {

    this.sub1 = this.apiService.connector$().subscribe(connector=>{
      if(!connector) return;

      console.log(' connector.exchange  ' + connector.exchange);

      this.apiConnector = connector;

      //connector.loadAllMarketSummaries();

   /*   connector.getAllMarkets().toPromise().then(res=>{
        console.warn(res);
      })*/

      if(this.subMarkets) this.subMarkets.unsubscribe();
      this.subMarkets = connector.getAllMarkets().subscribe(res=>{
       //  console.log(res);
        this.marketsArAll = res;
        this.render();
      })


    })

  }

  ngOnDestroy(){
    if(this.sub1) this.sub1.unsubscribe();
    if(this.sub2) this.sub2.unsubscribe();
  }

  onPairClick(){

    this.onSortClick('pair');

  }

  onRankClick(){
    this.onSortClick('coinRank');
  }

  render(){
    if(!this.marketsArAll) return;

    let ar = this.marketsArAll.filter(function (item) {
      return this.ar.indexOf(item.base) !==-1;
    },{ar:this.checked});

    if(this.isSelectedOnly){
      ar = ar.filter(function (item) {
        return item.selected;
      });
    }

    this.doSort(ar);

  }

  @ViewChild('baseBTC') baseBTC;
  @ViewChild('baseETH') baseETH;
  @ViewChild('baseUSDT') baseUSDT;
  private checked = ['BTC', 'ETH','USDT' ];

  onChangeBase(){
    let checked:string[] = [];
    if(this.baseBTC.checked)checked.push('BTC');
    if(this.baseETH.checked)checked.push('ETH');
    if(this.baseUSDT.checked)checked.push('USDT');

    this.checked = checked;
    this.render();
    // console.log(this.baseBTC.checked, this.baseETH.checked, this.baseUSDT.checked);
  }


  private sortBy = 'pair';
  private asc_desc = 'asc';
  private doSort(ar:VOMarket[]){
    this.marketsAr = _.orderBy(ar, this.sortBy, this.asc_desc);
  }

  onSortClick(sortBy:string){
    console.log(sortBy);
    if(this.sortBy === sortBy){
      if(this.asc_desc === 'asc') this.asc_desc ='desc';
      else  this.asc_desc='asc';
    }else this.asc_desc = 'asc';
    console.log(this.asc_desc);
    this.sortBy = sortBy;
    if(this.marketsAr) this.doSort(this.marketsAr);
  }


  onMarketClick(market:VOMarket){
    let pair = market.pair;

    window.open('https://bittrex.com/Market/Index?MarketName='+pair.replace('_','-'),'_blank');


  }

  onMarketSelected(evt, market:VOMarket){
   // console.log(evt);

    let selected = this.apiConnector.getMarketsSelected();
    let ind = selected.indexOf(market.pair);
    if(evt.target.checked) {
      if(ind ===-1) selected.push(market.pair);
      market.selected = true;
    }else {
      if(ind !==-1) selected.splice(ind,1);
    }

    this.apiConnector.saveMarketsSelected();

  }
  onChartClick(market:any){
    let symbolTo:string = market.MarketName.split('-')[1];

    /*  let mc = this.marketCap.getBySymbol(symbolTo);
      if(!mc){
        this.snackBar.open('No coin ' + symbolTo,'x', {duration:3000});
        return;
      }

      let id = mc.id;
      window.open('https://coinmarketcap.com/currencies/'+id,'_blank');
 */
  }


  isSelectedOnly:boolean = true;
  onSelectedChckClick(evt){
    // console.log(evt);
    this.isSelectedOnly = evt.checked;
    this.render();
  }


  onRefreshClick(){
    //this.bittrexPublic.refershMarkets();
  }

}
