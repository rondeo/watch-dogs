import {Component, Input, OnChanges, OnInit} from '@angular/core';
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

  curExchange: string;
  balanceBase: number;
  pendingBase: number;
  balanceCoin: number;
  pendingCoin: number;
  coin: string;
  base: string;

  isLoadinBalances = false;

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
      console.log(bal);
      this.base = bal.symbol;
      this.balanceBase = bal.available;
      this.pendingBase = bal.pending;
      this.isLoadinBalances = false;
    });
    this.sub2 = api.balance$(ar[1]).subscribe(bal => {
      console.log(bal);
      this.coin = bal.symbol;
      this.balanceCoin = bal.available;
      this.pendingCoin = bal.pending;

      this.isLoadinBalances = false;
    });

  }

  onRefreshBalancesClick() {
    this.isLoadinBalances = true;
    const api = this.apiPrivate.getExchangeApi(this.exchange);
    api.refreshBalances()
  }


}
