import {Injectable} from "@angular/core";
import {MyBot} from "./my-bot";
import {MarketCapService} from "../market-cap/market-cap.service";
import {BittrexPrivateService} from "./bittrex-private.service";
import {VOMarketCap} from "../models/app-models";

@Injectable()
export class BotTestService{

  private myBot:MyBot;
  private intervalMc;

  constructor(
    private marketCap:MarketCapService,
    private privateService:BittrexPrivateService
  ){

  }

  setBot(bot:MyBot){
    this.myBot = bot;
  }


  test(){
    this.marketCap.refresh();
  }

  private sub1;
  start(){
    this.stop();
   /* this.sub1 = this.marketCap.getCoins().subscribe(res=>{
      console.log(res);
    });*/
    console.log('start interval');
    this.intervalMc = setInterval(()=>{
      this.marketCap.refresh();
    },60000);

    this.marketCap.refresh();
  }
  stop(){
    if(this.sub1)this.sub1.unsubscribe();

    clearInterval(this.intervalMc);

  }

  runBot(data:{[symbol:string]:VOMarketCap}){
   this.myBot.runBot(data);

  }
}