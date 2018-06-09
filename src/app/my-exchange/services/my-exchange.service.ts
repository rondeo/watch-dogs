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

  getMyPivateExchanges(): string[] {
    let my: string[] = JSON.parse(localStorage.getItem('my-exchanges'));
    if (!my) my = this.apisPrivate.getAllAvailable();
    return my
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
    if(coin ==='USDT') return _.filter(Object.values(marketsAvailable), {base: coin});
    return _.filter(Object.values(marketsAvailable), {coin: coin});

  }

  async getBalancesAll(exchange: string, isRefresh = false): Promise<VOBalance[]> {
    if (!isRefresh && this.balancesAllExchanges[exchange]) return Promise.resolve(this.balancesAllExchanges[exchange]);
    const api = this.apisPrivate.getExchangeApi(exchange);
    if (!api) throw new Error(' no api for ' + exchange);
    return new Promise<VOBalance[]>((resolve, reject) => {
      api.downloadBalances().subscribe(balances => {
        this.balancesAllExchanges[exchange] = balances
        resolve(balances)
      }, reject);
    })

  }

  async getBalances(exchange, symbols: string[], isRefresh = false): Promise<VOBalance[]> {
    return this.getBalancesAll(exchange, isRefresh).then(balances => MyExchangeService.filterBalances(symbols, balances));
  }

}