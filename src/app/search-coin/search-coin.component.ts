import {Component, OnChanges, OnInit} from '@angular/core';
import {VOMarketCap, VOSearch} from '../models/app-models';
import {MarketCapService} from '../market-cap/market-cap.service';
import {SearchCoinService} from '../exchanges/search-coin.service';




@Component({
  selector: 'app-search-coin',
  templateUrl: './search-coin.component.html',
  styleUrls: ['./search-coin.component.css']
})
export class SearchCoinComponent implements OnInit, OnChanges {

  marketCapAr:VOMarketCap[];

  searchResults:VOSearch[];
  currentSearch:string;
  progress:number= 0;
  progressTimer:any;

  constructor(
    private marketCap:MarketCapService,
    private allExchanges:SearchCoinService

  ) { }


  onSelectSymbol(value:string){
    this.currentSearch = value;

    console.log(value);
  }

  onSubmit(){
    if(!this.currentSearch) return;
    this.currentSearch = this.currentSearch.toUpperCase();
    if(this.progressTimer)clearTimeout(this.progressTimer);
    this.progressTimer = setTimeout(()=>{ this.progress = 0},20000);
    this.allExchanges.sechCoin(this.currentSearch).subscribe(res=>{

      //console.log(res);

      this.searchResults = res;
      clearTimeout(this.progressTimer);
    })
  }
  ngOnChanges(changes){
    console.log(changes);
  }

  ngOnInit() {
    this.marketCap.coinsAr$.subscribe(res=>{
      this.marketCapAr = res;
    })
    this.marketCap.refresh();

    this.allExchanges.progress$.subscribe(res=>this.progress=res);

  }



}
