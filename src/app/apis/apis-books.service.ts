import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs/Observable";
import {VOBooks} from "../models/app-models";
import {Subject} from "rxjs/Subject";
import {ApisPublicService} from "./apis-public.service";
import {forkJoin} from "rxjs/observable/forkJoin";

@Injectable()
export class ApisBooksService {

  private booksSub:Subject<VOBooks> = new Subject();
  books$() :Observable<VOBooks>{
    return this.booksSub.asObservable();
  }
  constructor(private apis:ApisPublicService) { }

  downloadBooks(exchanges:string[], base:string, coin:string):Observable<any>{
    const subs = []
    exchanges.forEach( (item) => {
      subs.push(this.apis.getExchangeApi(item).downloadBooks(base,coin))
    })
    return forkJoin(subs)
  }

}
