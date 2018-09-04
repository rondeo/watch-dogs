import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {VONews} from '../../models/app-models';


@Injectable()
export class RedditService {

  allnews:VONews[];
  constructor(
    private http: HttpClient
  ) {

  }

  async getAllNews(): Promise<VONews[]> {
    if(this.allnews) return Promise.resolve(this.allnews);
    const altcoins: VONews[] = await this.getAltcoinRSS();
    const crytocur: VONews[] = await this.getCryptoCurrency();
    this.allnews = altcoins.concat(crytocur);
    return this.allnews;
  }
  getAltcoinRSS() {
    const url = '/api/proxy-cache-5min/https://www.reddit.com/r/altcoin.json';
      return this.http.get(url).map((res: any) => {
       // console.log(res);
        return res.data.children.map(function (item) {

          return {
            author: item.data.author,
            title: item.data.title,
            text: item.data.selftext,
            url: item.data.url
          }
        });
      }).toPromise()

  }

  getCryptoCurrency() {
    const url = '/api/proxy-cache-5min/https://www.reddit.com/r/CryptoCurrency.json';
    return this.http.get(url).map((res: any) => {
      //console.log(res);
      return res.data.children.map(function (item) {

        return {
          author: item.data.author,
          title: item.data.title,
          text: item.data.selftext,
          url: item.data.url
        }
      });
    }).toPromise()
  }
}
