import { Component, OnInit } from '@angular/core';
import {AllCoinsService} from '../all-coins.service';
import {StorageService} from '../../services/app-storage.service';
import {CoinSerciceBase} from '../coin-sercice-base';
import {CompareService} from '../../services/compare.service';

@Component({
  selector: 'app-all-main',
  templateUrl: './all-main.component.html',
  styleUrls: ['./all-main.component.css']
})
export class AllMainComponent implements OnInit {



  exchanges:any = {};
  apis:CoinSerciceBase[];

  constructor(
    private allConsService:AllCoinsService,
   // private sorage:StorageService
  ) {


  }

  ngOnInit() {

    this.exchanges = this.allConsService.getActiveExchanges();

    this.allConsService.apis$.subscribe(apis=>{
      if(!apis) return;
      let active = this.allConsService.getActiveExchanges();

      apis.forEach(function (item) {
        item.selected = active[item.uid];
      });
     // console.log(apis);
      this.apis=apis;
    })


  }

  onLoginClick(){

  }

  onChange(evt, api){
    let out ={};

    console.log(this.exchanges);
    this.apis.forEach(function (item) {
      out[item.uid]=item.selected;
    });
    this.allConsService.setActiveExchanges(out);

    this.allConsService.loadCoinsSelectedExchanges();
  }

  onLogoutClick(){

  }

}
