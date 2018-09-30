import {ApisPublicService} from '../../apis/apis-public.service';
import {StorageService} from '../../services/app-storage.service';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';

export class CandlesHist {
  coinPriceUS: number;

  constructor(
    private exchange: string,
    private market: string,
    private apisPublic: ApisPublicService,
    private storage: StorageService
  ) {

  }

  start() {

  }

  downloadCandle(){
    const api: ApiPublicAbstract = this.apisPublic.getExchangeApi(this.exchange);

  }
}
