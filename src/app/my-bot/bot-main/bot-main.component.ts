import { Component, OnInit } from '@angular/core';
import {Router} from "@angular/router";

@Component({
  selector: 'app-bot-main',
  templateUrl: './bot-main.component.html',
  styleUrls: ['./bot-main.component.css']
})
export class BotMainComponent implements OnInit {

  isLogedIn:boolean;
  currentExchange:string;
  currentMarket:string;
  exchanges:string[];
  markets:string[];

  constructor(
    private router:Router
  ) { }

  ngOnInit() {

  }

  onLogoutClick(){

  }

  onLoginClick(){

  }


  onExchangeChanged(){
    if(this.currentExchange && this.currentMarket)
    this.router.navigateByUrl('/my-bot/run/'+ this.currentExchange+'/'+ this.currentMarket)
  }

  onMarketChanged(){

  }

}
