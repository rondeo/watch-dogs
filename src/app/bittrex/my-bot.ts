import {BittrexPrivateService} from "./bittrex-private.service";
import {VOMarket, VOMarketCap} from "../models/app-models";
import {MarketCapService} from "../market-cap/market-cap.service";
import {Subscription} from "rxjs/Subscription";
import {AutoTransferProcess} from "./auto-transfer-process";

import {Utils} from "./Utils";
import * as _ from 'lodash';
import {SlackService} from "../services/slack.service";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";



export class AutoTransfer {
  id: number;
  txid: string;
  txCreated: string;
  txProcessed: string;
  bookOrders: number[];
  market: string;

  //base:string;
  coin: string;
  when: string;

  action: string;
  coinFrom: string;
  coinTo: string;
  amountFrom: number;
  amountTo: number;
  fee: number;
  rate: number;

  percent_change_1hLess:boolean;
  percent_change_1h: number;
  percent_change_24hLess:boolean;
  percent_change_24h: number;
  percent_change_7dLess:boolean;
  percent_change_7d: number;

  //amountUS: number;
  amountCoinUS:number;

  balanceCoinUS:number;
  balanceBaseUS:number;
  balanceCoinToHave:number;

 // isMax: boolean;
  active: boolean;
  disabled: boolean;
  createdAt: string;
  message: string;
  triggered:string[];
}

export interface VOBot {
  id: string;
  name:string;
  createdAt: string;
  updatedAt: string;
  market: string;
  base: string;
  coin: string;
  //current: AutoTransfer;
  amountUS: number;
  amountUSCurrent: number;
  active: boolean;
  isSlack:boolean;
  slackID:string;
  isTransfer:boolean;
  transfersLogs: string[];
  logs: string[];
  transfers: AutoTransfer[];

}

export class MyBot {
  botData: VOBot;
  id: string;
  balanceBase: number;
  balanceBaseUS: number;
  balanceCoin: number;
  balanceCoinUS: number;
  balances: any[];
  created: string;
  mcBase: VOMarketCap;
  mcCoin: VOMarketCap;
  inProcess: AutoTransferProcess[];
  logs: string[] = [];
  MC:{[symbol:string]:VOMarketCap};
  subMc;

  private errorSub:Subject<string>;
  error$:Observable<string>;
  private successSub:Subject<string>;
  success$:Observable<string>;
  isRunning:boolean;

  private marketService:any;

  constructor(
              private privateService: any,
              private marketCap: MarketCapService,
              private slack:SlackService,
              botData: VOBot
  ) {
    this.marketService = privateService.publicService;
    if (!botData) botData = MyBot.createNewBotData();
    this.botData = botData;
    this.id = this.botData.id;
    this.created = (new Date(this.id)).toLocaleDateString();

    this.subMc = this.marketCap.getCoinsObs().subscribe(res => {
      if (!res) return;
      this.MC = res;
      console.log('%c Market cap data ' + this.botData.market, 'color:pink');
      this.updatePrice();
      if(this.isRunning) this.runBot(res);
    });

    this.successSub = new Subject();
    this.success$ = this.successSub.asObservable();

    this.errorSub = new Subject();
    this.error$ = this.errorSub.asObservable();


  }

  destroy() {
    this.subMc.unsubscribe();
  }



  onTransferError(process: AutoTransferProcess, error) {

  }

  endTransfers() {

  }


  transferFromBaseToCoin(amountUS: number) {


  }



  doTransafer(transfer: AutoTransfer, amountBot:number) {

    let botValue = this.botData.amountUS;
    let amountCoin = 0;
    let amountBase = 0;

    if(transfer.action ==='Sell') {
      amountCoin = this.balanceCoin;
    }else{
      amountBase = amountBot;
    }

    let message = this.getTransferMessage(transfer) + ' Triggered: '+  transfer.triggered.join("  ");


    if(this.botData.isTransfer){

      /*let request: TransferReqest = new TransferReqest(this.privateService, this.privateService.publicService);

      let market: string = this.botData.market,
        status: string = transfer.status;

      message +=' Transferring !!! ' + market +' ' + status +' Coin amount '+ amountCoin + ' Base amount '+amountBase + ' Max Value $' + botValue;

      request.setTransfer(market, status, amountCoin, amountBase).then(res => {
        console.log(res);
          this.registerMessage(res.toString());
        this.loadBalances().toPromise();

      }).catch(err => {
        {
          this.registerMessage(err.toString());
          console.error(err)
        }
      });
*/
      //request.startProcess();
    } else message += 'NOT Transferriong';


    this.registerMessage(message);

   //

  }

  registerMessage(message:string){
    if(!this.botData.transfersLogs) this.botData.transfersLogs = [];
    if(this.botData.transfersLogs.length > 300) this.botData.transfersLogs.shift();
    this.botData.transfersLogs.push(message);
    this.privateService.saveBots();

    if(this.botData.isSlack && this.botData.slackID){
      this.slack.sendMessage(message, this.botData.slackID).toPromise()
        .then(res=>{
          console.log(res);
        }).catch(err=>{
        console.error(err);
      })
    }
  }

  runBot(mcData: { [symbol: string]: VOMarketCap }) {
    console.log(' running bot MarketCap Data '+ this.botData.market);
    let triggers = this.botData.transfers;
    console.log(triggers);

    let balanceCoinUS = this.balanceCoinUS;


    let results: AutoTransfer[] = Utils.filterTriggers(triggers, mcData, balanceCoinUS);
    if (results.length) {

      results.forEach(function (item) {
        console.log(item.triggered.join(' & '));
      });

      let transfer = results[0];

      if(results.length > 1){

        console.log(' triggered  ' + results.length +' but processing only first ' + transfer.triggered)
      }

      let botAmount = this.botData.amountUS/mcData[this.botData.base].price_usd;
      this.doTransafer(transfer, botAmount);

    } else {
      console.log(' none is triggered ')
    }

   // let mcCoin = mcData[this.botData.coin];

   // if(this.history.length > 300) this.history = this.history.splice(0,1);

    //this.history.push(mcCoin);
  }


  updatePrice() {
    if (!this.MC) return;

    let mc = this.MC;
    let symbol = this.getData().base;
    let m = mc[symbol];
    this.balanceBaseUS = (m ? +(m.price_usd * this.balanceBase).toFixed(2) : 0);
    symbol = this.getData().coin;
    m = mc[symbol];
    this.balanceCoinUS = (m ? +(m.price_usd * this.balanceCoin).toFixed(2) : 0);

    this.mcBase = mc[this.botData.base];
    this.mcCoin = mc[this.botData.coin];

  }

  loadBalances() {
    this.balances = [];

    let symbol = this.getData().base;
    return this.privateService.getBalance(symbol).switchMap(res => {
      console.log(res);
      // console.log(' balance loaded final ' + symbol, res);
      this.balances.push(res);
      this.balanceBase = res.available;
      let symbol2 = this.getData().coin;


      return this.privateService.getBalance(symbol2).map(res => {
          console.log(res);
        this.balances.push(res);
        ///console.log(' balance loaded  final ' + symbol2, res);
        this.balanceCoin = res.available;
        console.log('Balances Data');
        this.updatePrice();

        return {balanceBase: this.balanceBase, balanceCoin: this.balanceCoin};

      })
    })


  }

  onNewMarketData(){

  }

  isTest: boolean;

  test() {
    let coins = this.marketCap.coins
    this.runBot(coins);
  }


  private sub1: Subscription;

  private marketInterval;
  start() {
    if(this.botData.active) {
      this.isRunning = true;
      console.log(' start ' + this.botData.market + ' ' + this.botData.id);
      this.marketInterval = setInterval(()=>{

        if(!this.isRunning)clearInterval(this.marketInterval);
        else this.loadMarketData();
      }, 5*60*1000);
    }
  }


  marketData:VOMarket[];
  loadMarketData(){
    let a = this.botData.market.split('_')
    this.marketService.getMarketSummary(a[0], a[1]).toPromise().then(res=>{
      if(this.marketData.length > 120) this.marketData.shift();
      this.marketData.push(res);
      this.onNewMarketData()
    })
  }
  stop() {
    this.isRunning = false;
    clearInterval(this.marketInterval);
  }


  setData(botData: VOBot) {
    this.botData = botData;
  }



  getTriggers(): AutoTransfer[] {
    return this.botData.transfers;
  }

  getData(): VOBot {
    if (!this.botData) this.botData = MyBot.createNewBotData();
    return this.botData;
  }

  getTransferMessage(trigger: AutoTransfer): string {
    // console.log(trigger);
    let conditions = [];
    if (trigger.percent_change_1h) conditions.push(' 1h '+(trigger.percent_change_1hLess?'Less':'More')+' then ' + trigger.percent_change_1h);
    if (trigger.percent_change_24h) conditions.push(' 24h ' +(trigger.percent_change_24hLess?'Less':'More')+' then ' + trigger.percent_change_24h);
    if (trigger.percent_change_7d) conditions.push(' 7d ' +(trigger.percent_change_7dLess?'Less':'More')+' then ' + trigger.percent_change_7d);


    let msg = 'When ' + trigger.when + conditions.join(' AND ') + ' ' + trigger.action + ' ' + trigger.coin + ' ';
    // console.log(msg);
    return msg;
  }


  static createNewBotData(): VOBot {
    return {
      id: new Date().toISOString(),
      name:'New',
      market: null,
      base: null,
      coin: null,
      active: false,
      isSlack:true,
      slackID:'',
      isTransfer:false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      amountUSCurrent: 0,
      amountUS: 0,
      transfersLogs: [],
      logs: [],
      transfers: []
    }


  }


}

