import {ApisPublicService} from '../a-core/apis/api-public/apis-public.service';
import {ApisPrivateService} from '../a-core/apis/api-private/apis-private.service';
import {ApiPublicAbstract} from '../a-core/apis/api-public/api-public-abstract';
import {ApiPrivateAbstaract} from '../a-core/apis/api-private/api-private-abstaract';
import {VOBalance} from '../amodels/app-models';
import {ApiMarketCapService} from '../a-core/apis/api-market-cap.service';
import {VOMCObj} from '../amodels/api-models';

export class UsdtBtcMarket {
  private apiPublic: ApiPublicAbstract;
  private apiPrivate: ApiPrivateAbstaract;
  usdt: VOBalance = new VOBalance();
  btc: VOBalance = new VOBalance();
  usd: VOBalance = new VOBalance();
  MC: VOMCObj;

  constructor(
    public exchange: string,
    private apisPublic: ApisPublicService,
    private apisPrivate: ApisPrivateService,
    private marketCap: ApiMarketCapService
  ) {

    this.apiPublic = apisPublic.getExchangeApi(exchange);
    this.apiPrivate = apisPrivate.getExchangeApi(exchange);
    marketCap.ticker$().subscribe(mc =>{
      this.MC = mc;
    })

    this.apiPrivate.balances$().subscribe(balances => {
      // console.log(this.exchange, balances);
      this.usd = balances.find(function (item) {
        return item.symbol === 'USD'
      }) || new VOBalance();
      this.usdt = balances.find(function (item) {
        return item.symbol === 'USDT'
      })
      this.btc = balances.find(function (item) {
        return item.symbol === 'BTC'
      });
    })

  }
}
