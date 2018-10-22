import {Injectable} from '@angular/core';
import {DatabaseService} from './database.service';
import {StorageService} from './app-storage.service';
import {Subject} from 'rxjs/Subject';
import * as CryptoJS from 'crypto-js';
import {MatDialog} from '@angular/material';
import {LoginFormComponent} from '../material/login-form/login-form.component';

import {LoginExchangeComponent} from '../material/login-exchange/login-exchange.component';

export enum LoginStatus {
  APPLICATION_LOGIN_REQIRED,
  APPLICATION_LOGGED_IN,
  EXCHANGE_LOGIN_REQIRED,
  EXCHANGE_LOGGED_IN
}


export class VOLogin {
  exchange: string;
  status: LoginStatus;
}

@Injectable()
export class UserLoginService {

  private simplePass = 'watch dogs password';
  //promiseReject: Function;
  // promiseResolve: Function;
  exchange: string;
  salt: string;
  private loginSub: Subject<VOLogin> = new Subject();

  login$() {
    return this.loginSub.asObservable()
  }


  constructor(
    private dialog: MatDialog

    //  private storage: StorageService
  ) {

  }


  async saveSalt(salt: string): Promise<boolean> {
    let ID = CryptoJS.HmacSHA1('salt', this.simplePass).toString();
    localStorage.setItem(ID, salt);
    return Promise.resolve(true);
  }

  async getSalt() {
    if (this.salt) return Promise.resolve(this.salt)
    let ID = CryptoJS.HmacSHA1('salt', this.simplePass).toString();
    this.salt = localStorage.getItem(ID);
    if (this.salt) return Promise.resolve(this.salt);
    this.salt = await this.getPasswordFromUser();
    return this.salt;
  }


  decodeString(str: string, salt: string): string {
    return CryptoJS.AES.decrypt(str, salt).toString(CryptoJS.enc.Utf8);
  }

  encodeString(str: string, salt: string): string {
    return CryptoJS.AES.encrypt(str, salt).toString();
  }

  hashString(password: string): string {
    return CryptoJS.SHA256(password).toString();
  }

  async getPasswordFromUser() {
    return new Promise<string>((resolve, reject) => {

      let ref = this.dialog.open(LoginFormComponent, {
        width: '300px',
        height: '300px'
      })

      ref.afterClosed().subscribe(data => {

        if (data && data.email && data.password) {

          let salt = this.hashString(data.password);
          if (data.save) this.saveSalt(salt);
          resolve(salt);
        }
        reject('no password from user');
      })
    })
  }

  async geCredentialsFromUser(exchange) {
    return new Promise<string>((resolve, reject) => {
      let ref = this.dialog.open(LoginExchangeComponent, {
        width: '100vw',
        height: '300px',
        data: {
          exchange: exchange
        }
      })
      ref.afterClosed().subscribe(data => {
        if (data && data.apiKey && data.password) {
          resolve(JSON.stringify(data));
        }
        reject('no credentials from user');
      })
    })
  }

  async removeSalt() {
    let ID = CryptoJS.HmacSHA1('salt', this.simplePass).toString();
    return Promise.resolve(localStorage.removeItem(ID));
  }

  async removeExchangeCredentials(exchange: string) {
    const salt = await this.getSalt();
    const ID = CryptoJS.HmacSHA1(exchange + '-cred', salt).toString();
    localStorage.removeItem(ID);
  }

  async setExchnageCredentials(exchange: string) {
    const salt = await this.getSalt();
    const ID = CryptoJS.HmacSHA1(exchange + '-cred', salt).toString();
    let credentials = await this.geCredentialsFromUser(exchange);
    credentials = this.encodeString(credentials, salt);
    localStorage.setItem(ID, credentials);
    return credentials;
  }

  async getExchangeCredentials(exchange: string): Promise<string> {
    const salt = await this.getSalt();
    const ID = CryptoJS.HmacSHA1(exchange + '-cred', salt).toString();
    let credentials = localStorage.getItem(ID);
    if (!credentials) {
      credentials = await this.setExchnageCredentials(exchange);
    }
    return this.decodeString(credentials, salt);
  }


}
