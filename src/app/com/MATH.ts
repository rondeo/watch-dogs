export class MATH{
  static toDisplayValue(value:number):number{
    if(value< 1e-4) return value;
  }

  weiToEther(wei:string) {
    while(wei.length < 20) wei = '0'+wei;
    return wei.slice(0, 18)+'.'+ wei.slice(18);
  }

  /*export function sum(vals: string[]): string {
    let res = new thirdparty.bnjs(vals.shift());
    vals.forEach(function (item) {
      res = res.add(item);
    });
    return res.toString();
  }*/


  btcToSatoshi(btc:string){
    // console.log(btc)
    let ar = (''+btc).replace(',','.').split('.');
    let suffix ='';
    if(ar.length==1) suffix = '00000000';
    else {
      suffix = ar[1];
      while (suffix.length < 8) suffix+='0';
    }
    let res = ar[0]+suffix;
    while(res.length && res.substr(0,1) ==='0') res = res.substr(1);
    // console.log(res);
    return res;
  }

  satoshiToBtc(satoshi:string){
    while(satoshi.length < 10) satoshi = '0'+satoshi;
    return satoshi.slice(0, 8)+'.'+ satoshi.slice(8);
  }
}
