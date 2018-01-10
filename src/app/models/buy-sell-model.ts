import {VOBalance, VOTransfer} from "./app-models";

export class BuySellModel{

  private transfer:VOTransfer;
  private currentAmountUS:number;
  private chargedAmount:number = 0;

  priceBase:number;
  priceCoin:number;
  rate:number;

 setRate(num:number){
   this.rate = num;
   this.priceCoin = this.priceBase * num;
 }


  balanceBase:VOBalance;
  balanceCoin:VOBalance;


  set coin(str:string){
    this.transfer.coin = str
  }
  get coin():string{
    return this.transfer.coin;
  }
  set base(str:string){
    this.transfer.base = str;
  }
  get base():string{
    return this.transfer.base;
  }
  get market():string{
    return this.transfer.base +'_' + this.transfer.coin
  }
  set market(str:string){
    let ar = str.split('_');
    if(ar.length==2){
      this.base = ar[0];
      this.coin = ar[1];
      this.loadData();
    }else {
      this.base = null;
      this.coin = null
    }

  }

  amountBaseUS:number;


  getAmountTotalUS():number{
    return this.amountCoinUS + this.amountBaseUS;
  }


  get amountCoinUS(){
    return this.transfer.amountCoinUS;
  }
  set amountCoinUS(num:number){
    this.transfer.amountCoinUS = num;
  }

  set amountUS(num:number){

    this.currentAmountUS = num;
  }

  get amountUS():number{
    return  this.currentAmountUS;
  }

  set charge(num:number){
    this.chargedAmount = num;
  }
  get charge():number{
    return this.chargedAmount;
  }

  constructor(){
    this.balanceBase = new VOBalance();
    this.balanceCoin = new VOBalance();
    this.transfer = new VOTransfer();
  }


  loadData(){
    let str = localStorage.getItem(this.market);
    if(str){
      let data = JSON.parse(str);
      console.log(data);
      //this.base = data.base;
      //this.coin = data.coin;
      this.charge = data.charge;
    }
  }

  save(){
    let data = {
     // base: this.base,
    //coin: this.coin,
    charge: this.charge
    }
    localStorage.setItem(this.market, JSON.stringify(data) )
  }

}
