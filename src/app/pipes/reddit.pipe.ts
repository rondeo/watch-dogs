import { Pipe, PipeTransform } from '@angular/core';
import {RedditService} from '../apis/news/reddit.service';

@Pipe({
  name: 'reddit'
})
export class RedditPipe implements PipeTransform {
  private data:{title: string, text: string}[];

  static countTitle(coin:string, data:any[]): number{
   return data.filter(function (item) {
      return item.title.indexOf(coin) !== -1;
    }).length;
  }
  static countText(coin:string, data:any[]): number{
    return data.filter(function (item) {
      return item.title.indexOf(coin) !== -1;
    }).length;
  }

  constructor(
    private rededit: RedditService
  ){
   rededit.getAltcoinRSS().then(res=>this.data = res);
  }

  async transform(value: string): Promise<string> {
    if(this.data)  {
      const news = this.filterData(value, this.data);
      return news.news1+'' + news.news2;
    }
    return null;
  }

  private filterData(coin: string, data: {title: string, text: string}[]): {news1:number, news2: number}{
    return {
      news1: RedditPipe.countTitle(coin, data),
      news2: RedditPipe.countTitle(coin, data)
    }

  }

}
