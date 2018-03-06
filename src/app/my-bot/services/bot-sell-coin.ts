import {MarketCapService} from "../../market-cap/market-cap.service";
import {ApiBase, IApiPublic} from "../../my-exchange/services/apis/api-base";
import {VOMarketCap} from "../../models/app-models";

export class BotSellCoin {

  constructor(
    private baseMC:VOMarketCap,
    private coinMC:VOMarketCap,
    private marketCap:MarketCapService
  ){
    marketCap.getCoinsObs().subscribe(MC=>{

      if(!MC) return;
      this.analize(MC)
    })
  }


  private analize(MC:{[symbol:string]:VOMarketCap}){

    let baseMC = MC[this.baseMC.symbol];
    let coinMC = MC[this.coinMC.symbol];

    if(coinMC.percent_change_1h < -1){
      let follow = {
        base:this.baseMC.symbol,
        coin:this.baseMC.symbol,
        baseMC:baseMC,
        coinMC:coinMC
    }

      this.saveSell(follow)
    }
  }


  saveSell(follow:any){

    this.marketCap.http.post('http://localhost:8080/mongodb',{follow:follow})
      .subscribe(res=>{
      console.log(res);
    })


  }



}
