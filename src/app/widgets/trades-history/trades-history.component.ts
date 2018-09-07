import {Component, Input, OnChanges, OnDestroy, OnInit} from '@angular/core';
import {ConnectorApiService} from '../../my-exchange/services/connector-api.service';
import {ChannelEvents, Channels, IChannel} from '../../my-exchange/services/apis/socket-models';
import * as _ from 'lodash';
import {VOOrder} from '../../models/app-models';
import {ApisPublicService} from '../../apis/apis-public.service';
import {SocketBase} from '../../apis/sockets/soket-base';

@Component({
  selector: 'app-trades-history',
  templateUrl: './trades-history.component.html',
  styleUrls: ['./trades-history.component.css']
})
export class TradesHistoryComponent implements OnInit, OnChanges, OnDestroy {

  @Input() exchange: string;
  @Input() market: string;

  constructor(
    private apiPubblic: ApisPublicService
  ) {
  }


  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
    if(this.socket) this.socket.unsubscribeFromTrades(this.market);
  }

  ngOnChanges(evt) {
    this.ctrConnect();
  }

  ngOnInit() {

  }


  archive: VOOrder[] = [];

  addToArchive(ar: VOOrder[]) {

  }

  analize() {

  }

  socket: SocketBase;
  ctrConnect() {
    if (!this.exchange || !this.market) return;
    const api = this.apiPubblic.getExchangeApi(this.exchange);
    if (api && api.hasSocket()) {
      const socket: SocketBase = api.getTradesSocket();
       socket.subscribeForTrades(this.market).subscribe(res =>{
         console.log(res);
       })
      this.socket = socket;
    }
  }

  parseData(data: VOOrder) {


  }

  sub;


}
