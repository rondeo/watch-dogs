import {VOExchangeCoin} from '../market-cap/market-cap.service';

export function filterSelected(ar:any[], selected:string[]):any[]{
  return ar.filter(function (item) {
    return this.sel.indexOf(item.symbol) !==-1;
  }, {sel:selected})
}



export class Utils{

  static filterMarkets(symbol:string, coins:VOExchangeCoin[]):string[]{
    let out:string[] =[];
    coins.forEach(function (item) {
    if(item.pair.indexOf(this.s) !==-1) this.out.push(item.exchange);
    }, {s:symbol, out:out});
    return out;
  }

static filterMarkets3(symbol:string, coins:VOExchangeCoin[]):number{
  let start:number=0;
  return coins.reduce(function (s, item) {
    return s+=+item.coinId
  }, start);

}

}

export function applyMixins(derivedCtor: any, baseCtors: any[]) {
  console.log(derivedCtor)
  baseCtors.forEach(baseCtor => {
    console.log(baseCtors)
    Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
      console.log(name);
      if (name !== 'constructor') {
        derivedCtor.prototype[name] = baseCtor.prototype[name];
      }
    });
  });
}