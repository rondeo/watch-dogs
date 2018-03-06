
import { Component, OnInit } from '@angular/core';
import {Router} from "@angular/router";

@Component({
  selector: 'app-bot-new',
  templateUrl: './bot-new.component.html',
  styleUrls: ['./bot-new.component.css']
})
export class BotNewComponent implements OnInit {

  currentExchange:string;
  currentMarket:string;
  exchanges:string[];
  markets:string[];

  constructor(
    private router:Router
  ) { }

  ngOnInit() {
  }


  onExchangeChanged(){
    if(this.currentExchange && this.currentMarket)
      this.router.navigateByUrl('/my-bot/run/'+ this.currentExchange+'/'+ this.currentMarket)
  }

  onMarketChanged(){

  }

}
