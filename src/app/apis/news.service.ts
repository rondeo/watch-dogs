import { Injectable } from '@angular/core';
import {RedditService} from './news/reddit.service';
import {VOMCDisplay, VONews} from '../models/app-models';
import {HttpClient} from '@angular/common/http';
import {CoindeskService} from './news/coindesk.service';

export type News = {
  count: number,
  source: string
}
@Injectable()
export class NewsService {

  constructor(
    private http: HttpClient,
    private reddit: RedditService,
    private coinDesk: CoindeskService
  ) { }

  async addNews(ar: VOMCDisplay[]){
    const reddit = await this.reddit.getAllNews();
    const coindesk = await this.coinDesk.getFeed();

    ar.forEach((coin)=>{
      coin.news1 = this.searchCoinInNews(coin.name, reddit).length;
      coin.news2 = this.searchCoinInNews(coin.name, coindesk).length;;
    });
  }

  async addCoinDesk(ar: VOMCDisplay[]){
    const data = await this.coinDesk.getFeed();

    console.log(data);
  }

  async addReddit(ar: VOMCDisplay[]){
    const reddit = await this.reddit.getAllNews();

    ar.forEach((coin)=>{
      coin.news1 = this.searchCoinInNews(coin.name, reddit).length;
      coin.news2 = 0;
    });
    await this.addCoinDesk(ar);
  }

  searchCoinInNews(coin: string, news:{title: string, text: string} []): any[] {
    if(coin.length < 3) return [];
    coin = coin.toLocaleLowerCase();
    return news.filter(function (item) {
      return item.title.toLocaleLowerCase().indexOf(coin) !== -1 || item.text.toLocaleLowerCase().indexOf(coin) !==-1;
    });
  }


  async showNews(name: string, index: number){
console.log(name, index);
let rss
let news: VONews[];
    switch(index) {
      case 0 :
        rss = await this.reddit.getAllNews();
      case 1 :
        rss = await this.coinDesk.getFeed();


    }

    news = this.searchCoinInNews(name, rss);
    console.log(news);

    news.forEach(function (item) {
      if(item.url) {
        console.log(item.url);
        window.open(item.url, '_blank');
      }
    })

  }

}
