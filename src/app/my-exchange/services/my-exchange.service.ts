import {Injectable} from '@angular/core';
import {StorageService} from '../../services/app-storage.service';
import {VOBalance, VOMarket} from '../../models/app-models';
import {ApisPublicService} from '../../apis/apis-public.service';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import * as _ from 'lodash';
import {ApisPrivateService} from '../../apis/apis-private.service';

@Injectable()
export class MyExchangeService {


  balancesAllExchanges: { [exchange: string]: VOBalance[] } = {};

  static filterBalances(symbols: string[], balances: VOBalance[]): VOBalance[] {
    return balances.filter(function (item) {
      return symbols.indexOf(item.symbol) !== -1
    });
  }

  constructor(
    private store: StorageService,
    private apiPublic: ApisPublicService,
    private apisPrivate: ApisPrivateService
  ) {
  }


  async getBooks(exchange: string, base: string, coin: string) {
    const api: ApiPublicAbstract = this.apiPublic.getExchangeApi(exchange);
    return api.downloadBooks(base, coin).toPromise();

  }

  async getTrades(exchange: string, base: string, coin: string) {
    const api: ApiPublicAbstract = this.apiPublic.getExchangeApi(exchange);
    return api.downloadMarketHistory(base, coin).toPromise();

  }

  async getAllMarkets(exchange: string): Promise<{ [market: string]: VOMarket }> {
    const api: ApiPublicAbstract = this.apiPublic.getExchangeApi(exchange);
    return api.getMarketsAvailable();
  }

  async getMarketsForCoin(exchange: string, coin: string): Promise<VOMarket[]> {
    const api: ApiPublicAbstract = this.apiPublic.getExchangeApi(exchange);
    const marketsAvailable = await api.getMarketsAvailable();
    if (!marketsAvailable) throw new Error(' const marketsAvailable = await api.getMarketsAvailable() ');
    return _.filter(Object.values(marketsAvailable), {coin: coin});

  }

  async getBalances(exchange, symbols: string[], isRefresh = false): Promise<VOBalance[]> {
    if (!isRefresh && this.balancesAllExchanges[exchange]) return Promise.resolve(MyExchangeService.filterBalances(symbols, this.balancesAllExchanges[exchange]));
    const api = this.apisPrivate.getExchangeApi(exchange);
    if (!api) throw new Error(' no api for ' + exchange);
    return new Promise<VOBalance[]>((resolve, reject) => {
      api.downloadBalances().subscribe(balances => {
        this.balancesAllExchanges[exchange] = balances
        resolve(MyExchangeService.filterBalances(symbols, this.balancesAllExchanges[exchange]))
      }, reject);
    })
    // const balances =   await  api.downloadBalances().toPromise();
    // console.log(' balances ' ,balances);
    //
    //return
  }

}
