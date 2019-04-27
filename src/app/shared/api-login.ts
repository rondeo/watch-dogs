import {StorageService} from '../a-core/services/app-storage.service';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {Observable} from 'rxjs/internal/Observable';


export class ApiLogin {


  apiKey: string;
  password: string;
  isLogedInSub: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public exchange: string;
  storage: StorageService;
  constructor(
    storage: StorageService,
    exchange: string
  ) {
    this.exchange = exchange;
    this.storage = storage;
  }

  login(apiKey: string, password: string, isSave: boolean) {
    this.apiKey = apiKey;
    this.password = password;
    // console.log(this.apiKey, password);
    if (isSave)  this.storage.setItem(this.exchange + '-credentials', JSON.stringify({apiKey: apiKey, password: password}), true);
    if (apiKey && password)this.isLogedInSub.next(true);
    else this.isLogedInSub.next(false);
  }

  removeSavedLogin() {
    this.storage.removeItem(this.exchange + +'-credentials');
  }

  autoLogin(): void {
    // if (!this.storage.isLoggedIn()) return ;
   /* let str = this.storage.getItem(this.exchange +'-credentials', true);
    //console.warn('autoLogin ', str);
    if (str) {
      let credentials: { apiKey: string, password: string } = JSON.parse(str);
      // console.log(credentials);
      if (credentials && credentials.apiKey && credentials.password) this.login(credentials.apiKey, credentials.password, false);
    }*/
  }

  isLogedIn$(): Observable<boolean> {
    return this.isLogedInSub.asObservable();
  }


  logout() {
    this.apiKey = null;
    this.password = null;
    this.removeSavedLogin();
    this.isLogedInSub.next(false);
  }
}
