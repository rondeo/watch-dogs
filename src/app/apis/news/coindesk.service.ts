import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {UTILS} from '../../com/utils';
import {VONews} from '../../models/app-models';

@Injectable()
export class CoindeskService {

  private data: VONews[];
  constructor(
    private http: HttpClient
  ) { }

  getFeed():Promise<VONews[]>{
    if(this.data) return Promise.resolve(this.data);
    const url = '/api/proxy-cache-5min/https://www.coindesk.com/feed/';
    return this.http.get(url,  {responseType: 'text'}).map(res =>{
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(res, 'text/xml');
      const json = UTILS.xmlToJson(xmlDoc);
      // console.log(json);
      this.data =  json.rss.channel.item.map(function (item) {
        return {
          author: item['dc:creator']['#cdata-section'],
          title: item.title['#text'],
          text: item.description['#cdata-section'],
          url: item.guid['#text']
        }
      });
      return this.data;
    }).toPromise()
  }
}



