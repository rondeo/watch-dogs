export class UTILS {
  static toURLparams(obj: any) {
    return Object.keys(obj).map(function (item) {
      return item + '=' + this.obj[item];
    }, {obj: obj}).join('&');
  }
}
