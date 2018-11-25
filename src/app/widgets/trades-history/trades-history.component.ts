import {Component, Input, OnChanges, OnDestroy, OnInit} from '@angular/core';
import {ConnectorApiService} from '../../../../archive/services/connector-api.service';
import {ChannelEvents, Channels, IChannel} from '../../../../archive/services/apis/socket-models';
import * as _ from 'lodash';
import {VOOrder} from '../../models/app-models';
import {ApisPublicService} from '../../apis/api-public/apis-public.service';
import {SocketBase} from '../../apis/sockets/soket-base';
import {SocketChannel} from '../../apis/sockets/socket-channel';

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


  sub1;
  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
    if(this.sub1) this.sub1.unsubscribe();
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

  socket: SocketChannel;
  ctrConnect() {
    if (!this.exchange || !this.market) return;
    const api = this.apiPubblic.getExchangeApi(this.exchange);
    if (api && api.hasSocket()) {
      const socket = api.getTradesSocket().subscribeForTrades(this.market);
     this.sub1 =  socket.data$().subscribe(res =>{
         console.log(res);
       });
    }
  }

  parseData(data: VOOrder) {


  }

  sub;


}
