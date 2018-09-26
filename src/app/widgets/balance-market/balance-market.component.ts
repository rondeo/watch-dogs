import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {VOBalance} from '../../models/app-models';
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {ApisPrivateService} from '../../apis/apis-private.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';

@Component({
  selector: 'app-balance-market',
  templateUrl: './balance-market.component.html',
  styleUrls: ['./balance-market.component.css']
})
export class BalanceMarketComponent implements OnInit, OnChanges {

  @Input() exchange: string;
  @Input() market: string;
  @Input() timestamp: number;
  @Output() balanceBaseChange: EventEmitter<VOBalance> = new EventEmitter<VOBalance>();
  @Output() balanceCoinChange: EventEmitter<VOBalance> = new EventEmitter<VOBalance>();

  curExchange: string;
  balanceBase: number;
  pendingBase: number;
  balanceCoin: number;
  pendingCoin: number;
  coin: string;
  base: string;

  isLoadingBalances = false;

  constructor(
    private apiPrivate: ApisPrivateService
  ) {
  }

  ngOnInit() {
  }

  private sub1;
  private sub2;

  ngOnChanges() {

    if (!this.market || !this.exchange) return;

    const api = this.apiPrivate.getExchangeApi(this.exchange);
    const ar = this.market.split('_');
    if (ar.length !== 2) throw new class implements Error {
      message: 'wrong market ';
      name: 'DATA';
      stack: 'BalanceMarketComponent';
    };
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.sub2.unsubscribe();
    this.sub1 = api.balance$(ar[0]).subscribe(bal => {
     //  console.log(bal);
      this.base = bal.symbol;
      if(this.balanceBase !== bal.available || this.pendingBase !== bal.pending){
        this.balanceBaseChange.emit(bal);
      }
      this.balanceBase = bal.available;
      this.pendingBase = bal.pending;
      this.isLoadingBalances = false;
    });
    this.sub2 = api.balance$(ar[1]).subscribe(bal => {
     //  console.log(bal);
      if(this.balanceCoin !== bal.available || this.pendingCoin !== bal.pending){
        this.balanceCoinChange.emit(bal);
      }
      this.coin = bal.symbol;
      this.balanceCoin = bal.available;
      this.pendingCoin = bal.pending;
      this.isLoadingBalances = false;
    });

  }

  onRefreshBalancesClick() {
    this.isLoadingBalances = true;
    const api = this.apiPrivate.getExchangeApi(this.exchange);
    api.refreshBalances()
  }


}
