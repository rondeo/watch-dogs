import { Component, OnInit } from '@angular/core';
import {VOYoBit, YoBitService} from '../services/yo-bit.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-yo-bit-market',
  templateUrl: './yo-bit-market.component.html',
  styleUrls: ['./yo-bit-market.component.css']
})
export class YoBitMarketComponent implements OnInit {

  btcPairs:VOYoBit[];
  directPairs:VOYoBit[];
  selectedCoins:string[];


  showAll:boolean  = true;
  tableClass:string = 'show-all';


  constructor(private service:YoBitService) { }

  ngOnInit() {
    this.service.getCurrencies().subscribe(res=>{
     // console.log(res);
      let btc=[];
      let direct =[];
      let selected = this.getSelected();
      res.forEach(function (item) {
        let p = item.pair.split('_');
        item.symbol = p[0];
        item.to = p[1];
        if(item.to !=='btc') direct.push(item);
        else btc.push(item);
        item.selected =  selected.indexOf(item.pair)!==-1;
        item.class = item.selected?'show-me':'hide-me';

      });
      this.btcPairs = _.orderBy(btc, 'pair');
      this.directPairs = _.orderBy(direct, 'pair');

    })
  }

  onShowHide(){
    this.tableClass =this.showAll?'show-all':'hide-rows';
    console.log(this.showAll)
  }

  onCoinSelected(coin:VOYoBit){
    let ar = this.selectedCoins;
    if(coin.selected){
      coin.selected = false;
      _.pull(ar, coin.pair);

    }else{
      if(ar.indexOf(coin.pair)  ===-1) ar.push(coin.pair);
      coin.selected = true;
    }
    coin.class = coin.selected?'show-me':'hide-me';
    this.saveSelected();
   // console.log(coin.selected);
   // console.log(coin.class);

  }

  saveSelected(){
    localStorage.setItem('yobit-selected',JSON.stringify(this.selectedCoins));
  }

  getSelected():string[]{
    let str = localStorage.getItem('yobit-selected');
    if(!str)this.selectedCoins = [];
    else this.selectedCoins = JSON.parse(str);
    return this.selectedCoins;
  }
  onPairClick(coin:VOYoBit){
    let pair = coin.pair;
    this.service.getMarket(pair).subscribe(res=>{
      console.log(res);
      coin.market = res;
    })
  }

}
