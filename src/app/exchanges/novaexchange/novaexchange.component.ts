import { Component, OnInit } from '@angular/core';
import {NovaexchangeService, VONovo} from '../services/novaexchange.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-novaexchange',
  templateUrl: './novaexchange.component.html',
  styleUrls: ['./novaexchange.component.css']
})
export class NovaexchangeComponent implements OnInit {

  marketsAr:VONovo[]
  total:number;
  constructor(
    private novoService:NovaexchangeService
  ) { }

  ngOnInit() {

    this.novoService.getCurrencies().subscribe(res=>{
      if(!res) return;

      this.total = res.length;
      this.marketsAr = res.filter(function (item) {
        return item.volume24h !=0;
      });

    })
  }

}
