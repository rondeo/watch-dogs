import {Injectable} from '@angular/core';
import {VOMCDisplay, VONews} from '../../../amodels/app-models';
import {HttpClient} from '@angular/common/http';
import {UTILS} from '../../../acom/utils';
import {RSS} from './rss';
import {Observable, Subject} from '../../../../../node_modules/rxjs';
import {DatabaseService} from '../../services/database.service';
import {StorageService} from '../../services/app-storage.service';
import {map} from 'rxjs/operators';

export interface News {
  count: number;
  source: string;
}

@Injectable()
export class NewsService {

  private proxy = '/api/proxy-1hour/';
  reddit1URL = this.proxy + 'https://www.reddit.com/r/altcoin.rss';
  reddit2URL = this.proxy + 'https://www.reddit.com/r/CryptoCurrency.rss';

  coinDeskURL = this.proxy + 'https://www.coindesk.com/feed/';
  coinTelegraphURL = this.proxy + 'https://cointelegraph.com/feed';

  cnnURL = this.proxy + 'https://www.ccn.com/feed/';
  charlieSremURL = this.proxy + 'https://twitrss.me/twitter_user_to_rss/?user=CharlieShrem';
  bitcoinMagazine = this.proxy + 'http://forklog.net/feed/';
  bitcoinNews = this.proxy + 'https://news.bitcoin.com/feed/';
  coinBaseURL = this.proxy + 'https://blog.coinbase.com/feed';
  spectroCoinURL = this.proxy + 'https://blog.spectrocoin.com/en/feed/';

  cache = {};
  news;

  constructor(
    private http: HttpClient,
    private store: StorageService
  ) {
  }

  private _addNews(ar: VOMCDisplay[]) {
    const news = this.news;
    ar.forEach(function (item) {
      item.news1 = news[item.symbol];
    });
  }

  addNews(ar: VOMCDisplay[]): Observable<VOMCDisplay[]> {
    const sub = new Subject<VOMCDisplay[]>();
    if (this.news) {
      this._addNews(ar);
    } else {
      this.store.select('news').then(res => {
        if (res && Date.now() - res.timestamp < 60 * 60 * 1000) {
          this.news = res.data;
          this._addNews(ar);
          sub.next(ar);
        } else {
          this.news = {};
          this.addNext(ar, -1, sub);
        }
      });

    }
    return sub.asObservable();
  }

  async addNext(items: VOMCDisplay[], i: number, sub: Subject<VOMCDisplay[]>) {
    i++;
    if (i >= items.length) {
      sub.next(items);
      this.store.upsert('news', {
        data: this.news,
        timestamp: Date.now()
      });
      return;
    }
    const item = items[i];
    const coinName = item.name;
    const res = await this.getNews(coinName);
    item.news1 = res.length;
    this.news[item.symbol] = res.length;
    setTimeout(() => this.addNext(items, i, sub), 100);
    return res.length;
  }

  downloadFeed(url: string) {
    const id = url.replace(/[^a-zA-Z0-9]+/g, '');
    if (this.cache[id]) return Promise.resolve(this.cache[id]);
    console.log(url);
    return this.http.get(url, {responseType: 'text'}).pipe(
      map(res => this.cache[id] = RSS.parceRSSFeed(res))).toPromise();
  }

  async serachCoin(url, coinName, results: any[]) {
    const rss = await this.downloadFeed(url);
    const res = RSS.searchCoinInNews(coinName, rss);
    return results.concat(res);
  }

  async getNews(coinName: string) {
    // console.log(coinName);
    let res = [];
    res = await this.serachCoin(this.coinTelegraphURL, coinName, res);
    res = await this.serachCoin(this.reddit1URL, coinName, res);
    res = await this.serachCoin(this.reddit2URL, coinName, res);
    res = await this.serachCoin(this.coinDeskURL, coinName, res);
    res = await this.serachCoin(this.charlieSremURL, coinName, res);
    res = await this.serachCoin(this.cnnURL, coinName, res);
    res = await this.serachCoin(this.bitcoinMagazine, coinName, res);
    res = await this.serachCoin(this.bitcoinNews, coinName, res);
    res = await this.serachCoin(this.coinBaseURL, coinName, res);
    //  console.log('resMag', resMag);
    return res;

  }

}
