import {BittrexPrivateService} from "./bittrex-private.service";
import {AutoTransfer, MyBot} from "./my-bot";
import {VOMarketCap} from "../models/app-models";

export class AutoTransferProcess{

  history:string[];
  result;

  resolve:Function;
  reject:Function;
  promise:Promise<string[]>;

  balances:any[];
  balanceCoin:number;
  balanceCoinUS:number;
  balanceBase:number;

  constructor(private privateService:BittrexPrivateService, private transfer:AutoTransfer, private bot:MyBot){

    this.promise = new Promise((resolve, reject)=>{
      this.resolve = resolve;
      this.reject = reject;
    })


  }


  transferFromBaseToCoin(amount:number){

    return this.promise;
  }
  destroy(){

  }
/*

  isNeedProcess() {
    if (this.transfer.buySell === 'Buy') {
      if(this.transfer.isMax){
        if(this.bot.balanceBaseUS > 10) return 'requested buy max have more base $'+this.bot.balanceBaseUS.toFixed(2);
      }else  if(this.bot.balanceCoinUS < this.transfer.amountUS) return 'amount on coin $'+ this.bot.balanceCoinUS.toFixed(2) +' less then requested $'+ this.transfer.amountUS.toFixed(2);

      return null;

    }
  }
*/





  /*tryTransfer():Promise<string[]>{
    let need = this.isNeedProcess();
    if(!need){
      console.log(' process done ')

    }else {
      console.log(' need process ' + need);

      this.transferFromBaseToCoin(20);
    }
    return this.promise;
  }*/
}