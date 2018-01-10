import { Component, OnInit } from '@angular/core';
import {CompareService} from '../../services/compare.service';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-all-compare',
  templateUrl: './all-compare.component.html',
  styleUrls: ['./all-compare.component.css']
})
export class AllCompareComponent implements OnInit {

  constructor(
    private router:ActivatedRoute,
    private compare:CompareService
  ) { }

  ngOnInit() {

   let symbol =  this.router.snapshot.paramMap.get('symbol');
   console.log(symbol);
   symbol = symbol.toUpperCase();

   this.compare.getMarketsOfCoin(symbol).subscribe(res=>{

     console.log(res)
   });

  }

}
