import {VOBalance} from "../models/app-models";

export class MappersPrivate{
  static poloniexBalances(data):VOBalance[]{
    let out:VOBalance[] = [];
    for(let str in data) out.push({
      symbol: str,
      balance: +data[str]
    })

    return out
}
}