import {Component, Input, OnChanges, OnDestroy, OnInit} from '@angular/core';
import * as _ from 'lodash';
import {VOOrder} from '../../../amodels/app-models';
import {ApisPublicService} from '../../../adal/apis/api-public/apis-public.service';
import {SocketBase} from '../../../adal/apis/sockets/soket-base';
import {SocketChannel} from '../../../adal/apis/sockets/socket-channel';

@Component({
  selector: 'app-trades-history',
  templateUrl: './trades-history.component.html',
  styleUrls: ['./trades-history.component.css']
})
export class TradesHistoryComponent implements OnInit, OnChanges, OnDestroy {

  constructor(
    private apiPubblic: ApisPublicService
  ) {
  }

  @Input() exchange: string;
  @Input() market: string;


  sub1;


  archive: VOOrder[] = [];

  socket: SocketChannel;

  sub;
  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
    if (this.sub1) this.sub1.unsubscribe();
  }

  ngOnChanges(evt) {
    this.ctrConnect();
  }

  ngOnInit() {

  }

  addToArchive(ar: VOOrder[]) {

  }

  analize() {

  }
  ctrConnect() {
    if (!this.exchange || !this.market) return;
    const api = this.apiPubblic.getExchangeApi(this.exchange);
    if (api && api.hasSocket()) {
      const socket = api.getTradesSocket().subscribeForTrades(this.market);
     this.sub1 =  socket.data$().subscribe(res => {
         console.log(res);
       });
    }
  }

  parseData(data: VOOrder) {


  }


}
