import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {BittrexPrivateService} from "../bittrex-private.service";
import {MatSnackBar} from "@angular/material";
import {MyBot} from "../my-bot";
import {MarketCapService} from "../../market-cap/market-cap.service";

@Component({
  selector: 'app-bot-list',
  templateUrl: './bot-list.component.html',
  styleUrls: ['./bot-list.component.css']
})
export class BotListComponent implements OnInit, OnDestroy {

  active:number;
  isRunning:boolean;
  start_stop:string = 'Start';
  isDeterminate = true;
  progressValue:number = 0;
  seconds:number =  0;
  counter:number = 0;
  myBots:MyBot[];
  marketCap:MarketCapService
  constructor(
    private route:ActivatedRoute,
    private router:Router,
    private privateService:BittrexPrivateService,
    private snackBar:MatSnackBar
  ) {
    this.marketCap = this.privateService.marketCap;
  }


  private sub1;
  ngOnInit() {

    this.sub1 = this.privateService.myBots$.subscribe(bots=>{
      console.log(bots);
      let active = bots.filter(function (item) { return item.botData.active;  });
      let inactiove  =  bots.filter(function (item) { return !item.botData.active;  });
      this.myBots = active.concat(inactiove);
    })
  }

  ngOnDestroy(){
    this.sub1.unsubscribe();
    if(this.sub2) this.sub2.unsubscribe();
    if(this.sub3) this.sub3.unsubscribe();

  }



  onDeleteBotClick(bot: MyBot) {
    if(confirm('You want to delete bot '+bot.botData.market +' '+ bot.id + '?'))this.privateService.deleBotById(bot.id);
  }


  private sub2;
  private sub3;
  startStopTimer(){
    this.isRunning = !this.isRunning;
    this.isDeterminate = !this.isRunning;

    let bots = this.myBots;
    let start = this.isRunning;

    bots.forEach(function (item) {
      if(start) item.start();
      else item.stop();
    });

    if(start){
      this.sub2 = this.marketCap.countDown$.subscribe(res=>this.seconds = res)
      this.sub3 = this.marketCap.getCoinsObs().subscribe(()=>this.counter++);
      this.marketCap.dispatchCouns();
    }else {
      if(this.sub2) this.sub2.unsubscribe();
      if(this.sub3) this.sub3.unsubscribe();
      this.counter = 0;
    }

  }
}
