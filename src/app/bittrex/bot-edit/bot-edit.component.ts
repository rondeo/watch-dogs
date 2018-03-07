import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {BittrexPrivateService} from "../bittrex-private.service";
import {MatSnackBar} from "@angular/material";
import {AutoTransfer, MyBot, VOBot} from "../my-bot";
import {VOMarket} from "../../models/app-models";
import {BotTestService} from "../bot-test.service";

@Component({
  selector: 'app-bot-edit',
  templateUrl: './bot-edit.component.html',
  styleUrls: ['./bot-edit.component.css']
})
export class BotEditComponent implements OnInit, OnDestroy {

  currentBot:MyBot;
  botData:VOBot;
  markets:VOMarket[];
  triggers:AutoTransfer[];
  triggerAdd = 'Add';
  currentTrigger:AutoTransfer;
  isEditMarket:boolean;
  isOnServer:boolean;
  constructor(
    private route:ActivatedRoute,
    private router:Router,
    private privateService:BittrexPrivateService,
    private snackBar:MatSnackBar,
    private testServics:BotTestService

  ) {
    //this.autoTransfer = new AutoTransfer();
    this.triggers = [];
  }

  ngOnDestroy(){
   this.sub1.unsubscribe();
  }
  sub1;
  ngOnInit() {

   /*this.sub1 =  this.privateService.publicService.getMarketsAr().subscribe(res=>{
      if(!res) return;
      this.markets = res;
    });

    //this.privateService.publicService.loadAllMarketSummaries();


    let id = this.route.snapshot.paramMap.get('id');

    console.log(id);
    if(id == 'new') this.createNewBot();
    else {
      this.currentBot = this.privateService.getBotById(id);
      if(this.currentBot) this.setBotData();
      else {
        console.warn(this.privateService.getBots());
        alert('no bot with id '+ id);
      }
    }
*/
  }


  setBotData(){
    this.botData = this.currentBot.getData();
    this.setMarket();
    this.setTriggers();
  }

  setTriggers(){
    let bot = this.currentBot;
    this.botData.transfers.forEach(function (item) {
      item.message = bot.getTransferMessage(item);
    });
    this.triggers = this.botData.transfers;
  }

  setMarket(){
    let market = this.botData.market;
    if(!market){
      alert('no market in bot data');
      return
    }
    let ar = market.split('_');
    this.botData.base = ar[0];
    this.botData.coin = ar[1];
    //this.autoTransfer.base = ;
   // this.currentTrigger.coin = this.botData.coin;
    this.currentBot.loadBalances().subscribe();
  }

  onMarketChanged(evt){
    this.setMarket();
    console.log(evt);
  }

  createNewBot(){
    this.currentBot = this.privateService.createNewBot();
    this.botData = this.currentBot.getData();
  }

  onSaveClick(){
    this.botData.transfers = JSON.parse(JSON.stringify(this.triggers));
    this.currentBot.setData(this.botData);
    this.privateService.saveBot(this.currentBot);
    if(this.isOnServer) this.privateService.saveOnServer().toPromise().then(res=>{
      console.log(res);
    }).catch(err=>{
      console.error(err);
    })

  }


  saveTrigger(){
  /*  if(this.triggerAdd ==='Add'){
      this.triggers.push(JSON.parse(JSON.stringify(this.currentTrigger)));
    }*/
    let triggers = this.botData.transfers;
    let id = this.currentTrigger.id;

    this.currentTrigger.message = this.currentBot.getTransferMessage(this.currentTrigger);


    let ids = triggers.map(function (item) {
      return item.id;
    });

    let index = ids.indexOf(id);
    //console.log(index, id, ids);
    let t = JSON.parse(JSON.stringify(this.currentTrigger));

    if(isNaN(id) ||  index === -1)  triggers.push(t);
    else triggers[index] = t;


    this.triggerAdd ='Add';

    this.botData.transfers = triggers;
    this.privateService.saveBots();
    this.triggers = triggers;
    this.isPlus = false;
    this.currentTrigger = null;


  }

  onAmountUSChange(evt){

  }

  onCoinChanged(evt){
    let val = evt.value;
    this.currentTrigger.when = val;
    console.log(evt);
  }

  onConditionChange(evt){

  }

  onBuySellChange(evt){

  }

  onPercent7dLess(){
      this.currentTrigger.percent_change_7dLess = !this.currentTrigger.percent_change_7dLess

  }
  onPercent24hLess(){

    this.currentTrigger.percent_change_24hLess = !this.currentTrigger.percent_change_24hLess
  }

  onPercent1hLess(){
    this.currentTrigger.percent_change_1hLess = !this.currentTrigger.percent_change_1hLess

  }


  onDeleteTriggerClick(trigger:AutoTransfer) {
    let ind = this.triggers.indexOf(trigger);
    console.log(ind);
    let botTrigger = this.currentBot.getTransferMessage(trigger);
    if(confirm('You want to remove trigger ' + botTrigger)){
      this.triggers.splice(ind, 1);
      this.privateService.saveBots();
    }
  }

  onEditTriggerClick(trigger:AutoTransfer){
    trigger.id = this.triggers.indexOf(trigger);
    this.triggerAdd = 'Save';
    this.isPlus = true;
    this.currentTrigger = JSON.parse(JSON.stringify(trigger));

  }



  isPlus:boolean
  onPlusClick() {
    this.isPlus = !this.isPlus;
    if(!this.isPlus){
      this.currentTrigger = null;
      this.triggerAdd = 'Add';

    }else {
      this.currentTrigger = new AutoTransfer();
      this.currentTrigger.coin = this.botData.coin;
    }



  }

  onTestClick() {

    this.currentBot.test();

   // this.testServics.setBot(this.currentBot);
    //this.testServics.start();


  }

  onBalancesRefresh() {

    this.currentBot.loadBalances().toPromise().then(res=>this.privateService.marketCap.refresh());

  }
}
