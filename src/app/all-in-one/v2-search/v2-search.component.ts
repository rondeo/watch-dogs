import {Component, OnDestroy, OnInit} from '@angular/core';
import {V2Service} from "../v2.service";
import {ActivatedRoute, Router} from "@angular/router";
import {VOMarket} from "../../models/app-models";

@Component({
  selector: 'app-v2-search',
  templateUrl: './v2-search.component.html',
  styleUrls: ['./v2-search.component.css']
})
export class V2SearchComponent implements OnInit, OnDestroy {

  marketsAr:VOMarket[];
  searchWord:string;
  searchTopic:string;

  private sub1;
  private sub2;
  constructor(
    private service:V2Service,
    private route:ActivatedRoute,
    private router:Router
  ) { }


  ngOnDestroy(){
    this.sub1.unsubscribe();
    this.sub2.unsubscribe();
  }

  ngOnInit() {
    this.sub1 = this.service.serchResult$.subscribe(res=>{
      console.log(res);
      this.searchWord = this.service.searchWord;
      this.searchTopic = this.service.searchTopic;
      this.marketsAr = res;
    });

   this.sub2 =  this.route.params.subscribe(params=>{
      console.log(params);
      this.searchWord = params.symbol;
      if(this.searchWord){
        this.service.searchSymbol(this.searchWord);
      }

    })


  }


  onMarketClick(market:VOMarket){
    console.log(market);
  }

}
