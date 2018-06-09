export class UTILS {
  static toURLparams(obj: any) {
    return Object.keys(obj).map(function (item) {
      return item + '=' + this.obj[item];
    }, {obj: obj}).join('&');
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