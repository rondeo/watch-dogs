import {Injectable} from '@angular/core';
import {DatabaseService} from './database.service';
import {StorageService} from './app-storage.service';
import {Subject} from 'rxjs/Subject';
import {reject} from 'q';


export class ExchangeLogin {
  exchange: string;
  status: string;
}

@Injectable()
export class UserLoginService {

  promiceCredentials: Promise<string>;
  promiseReject: Function;
  promiseResolve: Function;
  exchange: string;
  private exchangeLoginSub: Subject<ExchangeLogin> = new Subject();

  exchangeLogin$() {
    return this.exchangeLoginSub.asObservable()
  }

  constructor(
    private storage: StorageService
  ) {
  }

  async getExchangeCredentials(exchange: string): Promise<string> {
    let credentials: string
    try{
      credentials = await this.storage.getItem(exchange + '-credentials', true);
    } catch (e) {
      console.warn(e);
      this.exchangeLoginSub.next({
        exchange: exchange,
        status: 'application-login-ewquired'
      })
    }

    if (credentials) return Promise.resolve(credentials);
    else {
      return new Promise<string>((resolve, reject) => {
        this.promiseResolve = resolve;
        this.promiseReject = reject;
        this.exchangeLoginSub.next({
          exchange: exchange,
          status: 'no-credetials'
        })
      })
    }
  }

  onLoginError(exchange: string, reason: string) {

  }

  async setExchangeCredetials(exchange: string, credentials: string) {
    await this.storage.setItem(exchange + '-credentials', credentials, true)
    if (exchange === this.exchange) this.promiseResolve(credentials);
    this.exchange = null;
    return true

  }

  async setSalt(email: string, salt: string, exchangeLogin?: ExchangeLogin): Promise<boolean> {
    return new Promise<boolean>(async(resolve , reject)=>{
      this.storage.setSalt(email, salt);
      if(exchangeLogin){
        const exchange = exchangeLogin.exchange;
        const credentials = await this.storage.getItem(exchange + '-credentials', true);
        if(credentials) resolve(true);
        else this.exchangeLoginSub.next({
          exchange: exchange,
          status: 'no-credetials'
        })
      } else resolve(true);

    })

  }

}
