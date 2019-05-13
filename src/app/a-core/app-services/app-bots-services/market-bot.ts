import {StorageService} from '../../services/app-storage.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {CandlesService} from '../candles/candles.service';

import {BtcUsdtService} from '../alerts/btc-usdt.service';
import {BotBase, MyOrder} from './bot-base';
import {OrderType, VOOrder, WDType} from '../../../amodels/app-models';

export class MarketBot extends BotBase {

  selected = false;
  priceLiquidInput = 0;
  isPriceLiquidEdit = false;

  constructor(
    exchange: string,
    market: string,
    potSize: number,
    storage: StorageService,
    apiPrivate: ApiPrivateAbstaract,
    apiPublic: ApiPublicAbstract,
    candlesService: CandlesService,
    marketCap: ApiMarketCapService,
    public btcusdt: BtcUsdtService,
    // private minuteCandles: MinuteCandlesService,
    // private candles15: Candles15minService

  ) {

    super(exchange, market, potSize, apiPrivate, apiPublic, candlesService, storage);

    // this.priceLiqud$.subscribe(v => this.priceLiquidInput = v);


    /* this.botInit().then(() => this.start());
    candles15.subscribe$(market).subscribe(candles => {
      console.log('market', candles)
    })*/
  }

  // lastOrder: { stamp: number, orderType: string, price: number };
  prevPrice: number;
  timeout;

  async setNewLiquidPrice() {
   // console.log(this.priceLiquidInput);
   // this.stopLoss.rate = this.priceLiquidInput;
   //  this.priceLiqud$.next(this.priceLiquidInput);
  }

  async setBuyOrder(rate: number, amountCoin: number): Promise<any> {
    if (this.wdType$.getValue() !== WDType.OFF) return super.setBuyOrder(rate, amountCoin);

    //  const amountCoin = pots * this.potSize;
    const pots = +(amountCoin / this.potSize).toFixed(1);
    const market = this.market;
    let uuid = Date.now();
    let orderType = OrderType.SELL;
    let isOpen = false;
    const timestamp = Date.now();
    let fee = amountCoin * 0.002;
    const order: MyOrder = new MyOrder({market, uuid, rate, orderType, amountCoin, isOpen, timestamp, fee, pots});
    const orders = this.ordersHistory$.getValue() || [];
    orders.push(order);
    this.ordersHistory$.next(orders);
    return Promise.resolve();
  }

  async tick() {

    /* const candles = await this.candlesService.getCandles(this.market);
     const lastCandle = _.last(candles);

     const lastPrice = lastCandle.close;
     if (this.prevPrice === lastPrice) return;

     console.log(this.market + ' ' + this.balance.state + ' ' + this.orders.state + ' ' + this.macdSignal.reason);

     setTimeout(() => this.save(), 5000);

     const candles15m = this.candlesService.getCandles15min(this.market);// .getCandles2(this.exchange, this.market, '15m');


     const last15m = _.last(candles15m);

     //  console.log(candles15m);

     const volumes = this.candlesService.volumes(this.market);
     const closes = CandlesAnalys1.closes(candles15m);

     const btcusdtState = this.btcusdt.state;

     /!*  if (btcusdtState === MarketState.DROPPING) {
         if (this.balance.state === BalanceState.SOLD) {
           return;
         }

         this.log({orderType: 'TO_USDT', reason: this.btcusdt.reason});
         const cancelResults = await this.orders.cancelAllOrders();
         this.log({orderType: 'CANCEL ALL ORDERS', reason: _.map(_.flatten(cancelResults), 'uuid').toString()});

         this.state = BotState.TO_USDT;
         this.sellCoinInstant(0);

         return;
       }*!/

     this.prevPrice = lastCandle.close;

     if (!this.mcCoin) {
       this.log({action: 'ERROR', reason: ' no Marketcap data '});

       return;
     }


     //  const signal = this.macdSignal.tick(closes, last15m);

     const mas = CandlesAnalys1.mas(null, closes);
     // const midPrice = +((last15m.close + last15m.open) / 2).toFixed(8);
     const buyPrice = mas.ma3;


     let macdState = this.macdSignal.state;


     // console.log(this.market + ' macd ' + macdState + ' ' + this.macdSignal.reason);


     ///////////////////////////////////

     if (macdState === BuySellState.BUY_NOW && this.balance.state === BalanceState.SOLD && this.orders.state === OrdersState.NONE) {

       this.log({action: 'BUY NOW', reason: this.macdSignal.reason});

       console.log('%c ' + this.market + ' ' + BuySellState.BUY_NOW, 'color:red');

       const balanceBaseUS = this.balance.baseBalance * this.priceBase;
       this.log({action: 'BALANCES ', reason: ' base ' + balanceBaseUS + ' coin ' + this.amountUS});
       if (balanceBaseUS < this.amountUS) {
         this.log({action: 'STOP BUY BASE ', reason: 'NO amount base'});
         return
       }

       const mcStats = 'r6 ' + this.mcCoin.r6 + ' r24 ' + this.mcCoin.r24 + ' 1w '
         + this.mcCoin.percent_change_7d + ' 1d ' + this.mcCoin.percent_change_24h;


       this.log({action: 'MC', reason: mcStats});
       if ((this.mcCoin.r6 - this.mcCoin.r24) < 0 && this.mcCoin.percent_change_7d < -3) {
         this.log({action: 'STOP BUY MC', reason: mcStats});
         return;
       }*/


    /*   const candles5m = this.candlesService.getCandles5m(this.market);
       const volumes5m = CandlesAnalys1.volumes(candles5m);
       const closes5m = CandlesAnalys1.closes(candles5m);
       const mas5m = CandlesAnalys1.mas(null, closes5m);
       const last5m = _.last(candles5m);
       const ma3_7 = MATH.percent(mas5m.ma3, mas5m.ma7);
       const ma25_99 = MATH.percent(mas5m.ma25, mas5m.ma99);
       const Vd = MATH.percent(last5m.Volume, MATH.median(volumes5m));
       const time5m = moment(last5m.to).format('HH:mm');

       this.log({orderType: 'Candle  ', reason: 'C 5m ' + last5m.close + ' O ' + last5m.open + ' ' + time5m});

       //  const vols = CandlesAnalys1.volumes(candles15m);


       this.log({orderType: 'MAS ', reason: 'ma3_7 ' + ma3_7 + ' ma25-99 ' + ma25_99 + ' Vd ' + Vd});
 */
    /*

          this.log({action: 'USDT_BTC', reason: btcusdtState});
          // this.state = BotState.BUYING;
         //  this.buyCoinInstant(0);
           this.setBuyOrder(buyPrice);
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
         // const vols = CandlesAnalys1.volumes(candles15m);
         // const Vd = MATH.percent(last15m.Volume, MATH.median(vols));

          this.log({action: 'MAS', reason: 'MA25-99' + MATH.percent(mas.ma25, mas.ma99)});
          this.log({action: 'MC', reason: ' r6 ' + this.mcCoin.r6 + ' r24 ' + this.mcCoin.r24});
          this.log({action: 'USDT_BTC', reason: btcusdtState});
          this.setSellOrder(buyPrice);
          //this.state = BotState.SELLING;
          return;
        }

        if (this.orders.state === OrdersState.BUYING) {
          if (macdState === BuySellState.SELL) {
            this.log({action: 'CANCEL BUY', reason: 'macd SELL'});
           //  this.orders.cancelBuyOrders();
            return;
          }
          const buyOrders = this.orders.buyOrders;
          const age = moment().diff(_.first(buyOrders).timestamp, 'minutes');
          const rate = _.first(buyOrders).rate;
          const priceD = MATH.percent(mas.ma3, rate);

          if (age > 40 && priceD > 1) {
            this.log({action: 'CANCEL BUY', reason: ' age > 40 ' + age + ' Pd ' + priceD + ' ' + rate});
            this.orders.cancelBuyOrders();
          } else {
            this.log({action: 'BUYING', reason: 'age ' + age + ' Pd ' + priceD + ' macd ' + this.macdSignal.state});
          }

          if (this.balance.state === BalanceState.BOUGHT) {
            this.log({action: 'PART BUY', reason: 'age ' + age + ' Pd ' + priceD});
          }

          return;
        }

        if (this.balance.state === BalanceState.BOUGHT && this.orders.state === OrdersState.SELLING) {

          if (macdState === BuySellState.BUY) {
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
        }

        // this.log({orderType: 'close < ma25', reason: '  ma25 ' + mas.ma25.toFixed(8) + ' close ' + last15m.close});


        if (this.orders.state === OrdersState.STOP_LOSS) {
          this.stopLossOrder.checkStopLoss(stopLossPrice, this.balance.balance);
        }

        if (this.orders.state === OrdersState.NONE && this.balance.state === BalanceState.BOUGHT) {
          this.stopLossOrder.setStopLoss(stopLossPrice, this.balance.balance)
        }
    */


  }

  cancelOrder(uuid: string) {
    return this.apiPrivate.cancelOrder2(uuid, this.market);
  }
}
