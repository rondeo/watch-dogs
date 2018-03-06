import { Component, OnInit } from '@angular/core';
import {Router} from "@angular/router";

@Component({
  selector: 'app-bot-main',
  templateUrl: './bot-main.component.html',
  styleUrls: ['./bot-main.component.css']
})
export class BotMainComponent implements OnInit {

  isLogedIn:boolean;


  constructor(
    private router:Router
  ) { }

  ngOnInit() {

  }

  onLogoutClick(){

  }

  onLoginClick(){

  }



}
