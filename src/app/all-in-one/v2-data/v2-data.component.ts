import { Component, OnInit } from '@angular/core';
import {V2Service} from '../v2.service';
import {V2BaseSercice} from '../v2-base';
import {ActivatedRoute, Router} from '@angular/router';
import {VOMarket} from '../../models/app-models';

@Component({
  selector: 'app-v2-data',
  templateUrl: './v2-data.component.html',
  styleUrls: ['./v2-data.component.css']
})
export class V2DataComponent implements OnInit {



  constructor(
    private service:V2Service,
    private route:ActivatedRoute,
    private router:Router
  ) { }


  exchanges:V2BaseSercice[];
  seachSymbol:string;

  marketsResults:VOMarket[];

  ngOnInit() {

    this.service.serchResult$.subscribe(res=>{
      console.log(res);
      this.marketsResults = res;

    });



    this.route.params.subscribe(params=>{
      console.log(params);


      this.seachSymbol = params.symbol;

    })
    //this.service.exchanges$.subscribe(res=>this.)


    this.service.loadExchangesMarkets((counter)=>{
      console.log(counter);
      if(counter ===0){
        if(this.seachSymbol){
          this.service.searchSymbol(this.seachSymbol);
        }
      }
    });

  }

}
