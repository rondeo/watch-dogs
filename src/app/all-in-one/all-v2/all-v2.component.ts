import { Component, OnInit } from '@angular/core';
import {V2Service} from "../v2.service";
import {ActivatedRoute, Router} from "@angular/router";
import {V2BaseSercice} from "../v2-base";

@Component({
  selector: 'app-all-v2',
  templateUrl: './all-v2.component.html',
  styleUrls: ['./all-v2.component.css']
})
export class AllV2Component implements OnInit {

  exchanges:V2BaseSercice[];

  constructor(
    private service:V2Service,
    private route:ActivatedRoute,
    private router:Router
  ) { }

  ngOnInit() {

    this.service.exchanges$.subscribe(res=>{
      this.exchanges = res;
    })
  }

  onExchangeClick(exchange: V2BaseSercice) {
    if(exchange.isError) return;
    console.log(exchange)
    this.router.navigateByUrl('/all-in-one-v2/exchange/'+exchange.config.uid);

  }


  onCoinsClick(){
   // this.router.navigate(['/all-in-one-v2/',{ outlets: { popup:['coinslist'] }}]);
  }

}
