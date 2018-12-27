import {StorageService} from '../../services/app-storage.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import * as _ from 'lodash';
import {CandlesService} from '../candles/candles.service';
import {MATH} from '../../com/math';
import {CandlesAnalys1} from '../scanner/candles-analys1';
import * as moment from 'moment';
import {BuySellState} from './macd-signal';
import {BtcUsdtService} from '../alerts/btc-usdt.service';
import {BalanceState} from './market-balance';
import {OrdersState} from './market-orders';
import {BotInit} from './bot-init';


export enum MCState {
  NONE = 'NONE',
  GREEN = 'GREEN',
  RED = 'RED'
}


export enum BotState {
  NONE = 'NONE',
  BUYING = 'BUYING',
  SELLING = 'SELLING',
  BOUGHT = 'BOUGHT',
  SOLD = 'SOLD',
  TO_USDT = 'TO_USDT',
  NO_BASE = 'NO_BASE',
  BALANCE_2 = 'BALANCE_2',
  BUYING_SELLING = 'BUYING_SELLING',
  IN_STOP_LOSS = 'IN_STOP_LOSS'
}


export class MarketBot extends BotInit {

  constructor(
    exchange: string,
    market: string,
    public reason: string,
    amountCoinUS: number,
    public isLive: boolean,
    storage: StorageService,
    apiPrivate: ApiPrivateAbstaract,
    apiPublic: ApiPublicAbstract,
    candlesService: CandlesService,
    marketCap: ApiMarketCapService,
    public btcusdt: BtcUsdtService
  ) {
    super(exchange, market, amountCoinUS, apiPrivate, apiPublic, candlesService, storage, marketCap);

    this.botInit().then(() => this.start());
  }

  // lastOrder: { stamp: number, action: string, price: number };
  prevPrice: number;
  interval;
  sub1;
  sub2;
  timeout;

  async tick() {

    const candles = await this.candlesService.getCandles(this.market);
    const lastCandle = _.last(candles);
    const lastPrice = lastCandle.close;
    if (this.prevPrice === lastPrice) return;

    console.log(this.market + ' ' + this.balance.state + ' ' + this.orders.state + ' ' + this.macdSignal.state);

    setTimeout(() => this.save(), 5000);

    const candles15m = this.candlesService.getCandles15min(this.market);// .getCandles2(this.exchange, this.market, '15m');

    const volumes = this.candlesService.volumes(this.market);

    const closes = this.candlesService.closes(this.market);

    if (!closes.length) return;

    const btcusdtState = this.btcusdt.state;

    /*  if (btcusdtState === MarketState.DROPPING) {
        if (this.balance.state === BalanceState.SOLD) {
          return;
        }

        this.log({action: 'TO_USDT', reason: this.btcusdt.reason});
        const cancelResults = await this.orders.cancelAllOrders();
        this.log({action: 'CANCEL ALL ORDERS', reason: _.map(_.flatten(cancelResults), 'uuid').toString()});

        this.state = BotState.TO_USDT;
        this.sellCoinInstant(0);

        return;
      }*/

    this.prevPrice = lastCandle.close;

    if (!this.mcCoin) {
      console.log('%c ' + this.market + ' NO MarketCap DATA', 'color:red');
      return;
    }

    const last15m = _.last(candles15m);
    const midPrice = +((last15m.close + last15m.open) / 2).toFixed(8);
    //  const signal = this.macdSignal.tick(closes, last15m);

    const mas = CandlesAnalys1.mas(null, closes);

    let macdState = this.macdSignal.state;


    // console.log(this.market + ' macd ' + macdState + ' ' + this.macdSignal.reason);


    ///////////////////////////////////

    if (macdState === BuySellState.BUY_NOW && this.balance.state === BalanceState.SOLD && this.orders.state === OrdersState.NONE) {

      this.log({action: 'BUY NOW', reason: this.macdSignal.reason});


      console.log('%c ' + this.market + ' ' + BuySellState.BUY_NOW, 'color:red');

      const balanceBaseUS = this.balance.baseBalance * this.priceBase;
      if (balanceBaseUS < this.amountCoinUS) {
        this.log({action: 'STOP BUY', reason: 'NO amount base'});
        return
      }

      this.log({action: 'MC', reason: ' r6 ' + this.mcCoin.r6 + ' r24 ' + this.mcCoin.r24});
      /*  if (this.mcCoin.r6 < 0) {
          this.log({action: 'STOP BUY', reason: 'r6 ' + this.mcCoin.r6});
          return;
        }*/

      const ma3_7 = MATH.percent(mas.ma3, mas.ma7);


      this.log({action: 'Candle  ', reason: 'C ' + last15m.close + ' O ' + last15m.open + ' ' + moment(last15m.to).format('HH:mm')});

      const vols = CandlesAnalys1.volumes(candles15m);
      const Vd = MATH.percent(last15m.Volume, MATH.median(vols));

      this.log({action: 'MAS ', reason: 'ma3_7 ' + ma3_7 + ' ma25-99 ' + MATH.percent(mas.ma25, mas.ma99) + ' Vd ' + Vd});

      this.log({action: 'USDT_BTC', reason: btcusdtState});
      // this.state = BotState.BUYING;
      this.setBuyOrder(midPrice);
      return;

      //  this.buyCoinInstant(' P ' + buyPrice + ' Vd ' + Vd);
    }


    if (macdState === BuySellState.SELL_NOW && this.balance.state === BalanceState.BOUGHT) {
      this.log({action: 'SELL NOW', reason: this.macdSignal.reason});

      if (this.orders.state === OrdersState.SELLING) {
        this.log({action: 'STOP SELL', reason: this.orders.state});
        return;
      }

      console.log('%c ' + this.market + ' ' + BuySellState.SELL_NOW, 'color:red');
      const vols = CandlesAnalys1.volumes(candles15m);
      const Vd = MATH.percent(last15m.Volume, MATH.median(vols));

      this.log({action: 'MAS', reason: 'MA25-99' + MATH.percent(mas.ma25, mas.ma99)});
      this.log({action: 'MC', reason: ' r6 ' + this.mcCoin.r6 + ' r24 ' + this.mcCoin.r24});
      this.log({action: 'USDT_BTC', reason: btcusdtState});
      this.setSellOrder(midPrice);
      //this.state = BotState.SELLING;
      return;
    }

    if (this.orders.state === OrdersState.BUYING) {
      if(macdState === BuySellState.SELL) {
        this.log({action: 'CANCEL BUY', reason: 'macd SELL'});
        this.orders.cancelBuyOrders();
        return;
      }
      const buyOrders = this.orders.buyOrders;
      const age = moment().diff(_.first(buyOrders).timestamp, 'minutes');
      const priceD = MATH.percent(mas.ma3,_.first(buyOrders).rate);

      if(age > 60 && priceD > 1) {
        this.log({action: 'CANCEL BUY', reason: 'age ' + age + ' Pd ' + priceD});
        this.orders.cancelBuyOrders();
      }else {
        this.log({action: 'BUYING', reason: 'age ' + age + ' Pd ' + priceD});
      }

      if (this.balance.state === BalanceState.BOUGHT) {
        this.log({action: 'PART BUY', reason: 'age ' + age + ' Pd ' + priceD});
      }

      return;
    }

    if (this.balance.state === BalanceState.BOUGHT && this.orders.state === OrdersState.SELLING) {

      if(macdState === BuySellState.BUY) {
        this.log({action: 'CANCEL SELL', reason: 'macd BUY'});
        this.orders.cancelSellOrders();
        return;
      }
      this.log({action: 'PROGRESS', reason: 'SELL'});
      return;
    }


    let stopLossPrice = last15m.close < mas.ma25 ? last15m.close : mas.ma25;

    if (last15m.close < mas.ma25) {
      const vols = CandlesAnalys1.volumes(candles15m);
      const Vd = MATH.percent(last15m.Volume, MATH.median(vols));

      this.log({
        action: 'MAS ',
        reason: 'ma3_7 ' + MATH.percent(mas.ma3, mas.ma7) + ' ma25-99 ' + MATH.percent(mas.ma25, mas.ma99) + ' Vd ' + Vd
      });
    }

    // this.log({action: 'close < ma25', reason: '  ma25 ' + mas.ma25.toFixed(8) + ' close ' + last15m.close});


    if (this.orders.state === OrdersState.STOP_LOSS) {
      this.stopLossOrder.checkStopLoss(stopLossPrice, this.balance.balance);
    }

    if (this.orders.state === OrdersState.NONE && this.balance.state === BalanceState.BOUGHT) {
      this.stopLossOrder.setStopLoss(stopLossPrice, this.balance.balance)
    }


  }


}
