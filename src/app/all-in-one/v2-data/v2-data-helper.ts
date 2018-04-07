import {VOMarketCap} from "../../models/app-models";

export class V2DataHelper {
  static parseData(MC, bases: string[], res: any[]): string[][] {
    var arMC = Object.values(MC).filter(function (item: VOMarketCap) {
      return item.rank < 200
    });
    const out = [];
    const table = [];
    const basePrices = {};
    arMC.forEach(function (coinMC: VOMarketCap) {

      const coin = coinMC.symbol;
      const coinPriceMC = coinMC.price_usd;

      bases.forEach(function (base) {
        const row: any[] = [coin, base];
        const baseMC = MC[base];
        const basePrice = base === 'USDT' ? 1 : baseMC.price_usd;
        const market = base + '_' + coin;

        res.forEach(function (markets, i) {
          if (markets[market]) {
            const rate = markets[market].Last;
            const coinPrice = rate * baseMC.price_usd;


            row[i + 2] = Math.round(1000 * (coinPrice - coinPriceMC) / coinPriceMC) / 10
          }
        });

        if (row.length > 2) table.push(row);
      });

    })
    return table;

  }

  static filterBooks(books:{amountCoin:number; rate:number}[], baseUS: number, amountUS: number): number {
    let amount = 0;

    for(let i = 0, n= books.length; i<n; i++){
      const book = books[i];
      const amountUS = book.amountCoin * baseUS;
      const rateUS = book.rate * baseUS;
      amount += amountUS;
      if( amount > amountUS) return rateUS;
    }

    return 0
  }
}