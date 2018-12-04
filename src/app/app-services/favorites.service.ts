import {Injectable} from '@angular/core';
import {DialogInputComponent} from '../material/dialog-input/dialog-input.component';
import * as moment from 'moment';
import {MatDialog} from '@angular/material';
import {StorageService} from '../services/app-storage.service';
import {Subject} from 'rxjs/internal/Subject';
import {from} from 'rxjs/internal/observable/from';
import {map} from 'rxjs/operators';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {Observable} from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {

  constructor(
    private dialog: MatDialog,
    private storage: StorageService
  ) {
  }


  view$(): Observable<any[]> {
    return this.data$()
      .pipe(
        map(o => o ? o.map(
          function (item) {
            return Object.assign({}, item, {x: 'X'})
          }) : null
        )
      );
  }

  private async data() {
    return this.storage.select('favorite-markets');
  }

  sub: BehaviorSubject<any[]>;

  data$() {
    if (!this.sub) {
      this.sub = new BehaviorSubject(null);
      this.data().then(res => this.sub.next(res))
    }
    return this.sub.asObservable();

  }

  addMarket(market: string) {
    const message = market + ' add to favorites';
    const ref = this.dialog.open(DialogInputComponent, {data: {message}});
    const sub = ref.afterClosed().toPromise().then(async res => {
      if (res) {
        const note = res.note;
        const date = moment().format('DD HH:mm');
        let data = await this.data()
        const obj = {date, market, note};
        data = data.filter(function (item) {
          return !!item.market && item.market !== obj.market;
        });
        data.unshift(obj);
        this.saveFavorites(data);
      }
    });
  }

  async delete(market: string) {
    let data = await this.data();
    data = data.filter(function (item) {
      return !!item.market && item.market !== market;
    });
    return this.saveFavorites(data);
  }

  async saveFavorites(data) {
    if (this.sub) this.sub.next(data);
    return this.storage.upsert('favorite-markets', data);
  }
}
