import { Injectable } from '@angular/core';
import {VOMarketCap} from '../models/app-models';
import * as CryptoJS from 'crypto-js';
//import * as crypto from 'crypto';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import * as localforage from 'localforage';

@Injectable()
export class StorageService {

  selected:string[];
  //email:string;
  email:string;
  //password:string;
  private simplePass = 'watch dogs password';

  private salt:string;
  //isLogedIn$:Observable<boolean>;
 // private isLogedInSub:BehaviorSubject<boolean>;

  constructor() {
    //this.isLogedInSub = new BehaviorSubject(false);
    ///this.isLogedIn$ = this.isLogedInSub.asObservable();
    this.lastVisitedUrl = localStorage.getItem('lastVisitedUrl');
  }

  /*isLoggedIn():boolean{
    return  this.isLogedInSub.getValue();
  }*/
  storeUserSimple(email:string, password:string){
    let user = CryptoJS.HmacSHA1('user', this.simplePass).toString();
    let data =  JSON.stringify({u:email, p:password});
    data =  CryptoJS.AES.encrypt(data, this.simplePass).toString();
    localStorage.setItem(user, data);
  }

  restoreUserSimple():{u:string, p:string}{
    let user = CryptoJS.HmacSHA1('user', this.simplePass).toString();
   let item = localStorage.getItem(user);
   if(!item) return null;
   item = CryptoJS.AES.decrypt(item, this.simplePass).toString(CryptoJS.enc.Utf8);
    return JSON.parse(item);
  }

  filterSelected(coins:VOMarketCap[]):VOMarketCap[]{
    let selected = this.getSelectedMC();
    return coins.filter(function (item) {
      return selected.indexOf(item.symbol) !==-1;
    })
  }
  mapSelected(coins:any){
    let selected = this.getSelectedMC();
    coins.forEach(function (item) {
      item.selected = selected.indexOf(item.symbol) !==-1;
    })

  }

  getSelectedMC(){
    if(!this.selected){
      this.selected = [];
      let str = localStorage.getItem('market-cap-selected');
      try {
        if (str) this.selected = JSON.parse(str);
      } catch (e) {
        console.error(e);
      }
    }

    return this.selected;

  }

  getEmail():string{
    return this.email;
  }

  hashPassword2(password:string):string{
    return CryptoJS.SHA256(CryptoJS.SHA256(password).toString()).toString();
  }

  hashPassword1(password:string):string{
    return CryptoJS.SHA256(password).toString();
  }

  isSaltSub:BehaviorSubject<string> = new BehaviorSubject(null);
  setSalt(email:string, salt:string){
    this.email = email;
    this.salt = salt;
    //console.log('set salt ' + salt);
    this.isSaltSub.next(salt);
   // this.salt = CryptoJS.HmacSHA1(password, this.simplePass).toString();
    //console.log(' salt ' + this.salt);
  }

  onSalt():Observable<string>{
    return this.isSaltSub.asObservable();
  }
  removeSalt(){
    this.salt = null;
    this.isSaltSub.next(null);   ;
  }

  addMCSelected(symbol:string){
    let ar = this.getSelectedMC();
    if(ar.indexOf(symbol) ==-1) ar.push(symbol);
    this.saveSelected();
  }

  deleteMCSelected(symbol:string){
    let ar = this.getSelectedMC();
    for(let i= ar.length -1; i>=0; i--) if(ar[i] === symbol )ar.splice(i,1);
    this.saveSelected();
  }


  async upsert(index:string, item:any):Promise<any>{
    return localforage.setItem(index, item);
  }

 async select(index:string):Promise<any>{

    return localforage.getItem(index);
  }

  saveSelected(){
    localStorage.setItem('market-cap-selected',JSON.stringify(this.selected));
  }

  getItem(s: string, secure = false) {
    if(secure){
      if(!this.salt) {
        alert('Please login in Application');
        return;
      }

      s =  CryptoJS.HmacSHA1(s, this.salt).toString();
     // console.log(s);

      let str = localStorage.getItem(s)
      if(str)  return CryptoJS.AES.decrypt(str, this.salt).toString(CryptoJS.enc.Utf8);
      else return null
    } else s = CryptoJS.HmacSHA1(s, this.simplePass).toString();
    return localStorage.getItem(s);
  }

  setItem(s:string, data:string, secure = false){
  //  console.log('save', data);
    if(secure){
      if(!this.salt) {
        alert('Please login in Application');
        return;
      }
      data = CryptoJS.AES.encrypt(data, this.salt).toString();
      s = CryptoJS.HmacSHA1(s, this.salt).toString();
    }else s = CryptoJS.HmacSHA1(s, this.simplePass).toString();
    return localStorage.setItem(s, data);
  }

  removeItem(s:string, secure = false){
    if(secure){
      if(!this.salt){
        alert('Please login in Application');
        return;
      }
      s = CryptoJS.HmacSHA1(s, this.salt).toString();
    }else s = CryptoJS.HmacSHA1(s, this.simplePass).toString();
    return localStorage.removeItem(s);
  }

  setLastVisitedUrl(url){
    this.lastVisitedUrl = url;
    localStorage.setItem('lastVisitedUrl', url);
  }
  private lastVisitedUrl:string;

  getLastVisitedUrl() {
    return this.lastVisitedUrl;
  }
}

/*

const algorithmCTR = 'aes-256-ctr',
  algorithmGSM= 'aes-256-gcm';

export function encryptCTR(text){
 let  PASSWORD = '3zTvzr3p67VC61jmV54rIYu1545x4TlY'
  var cipher = crypto.createCipher(algorithmCTR, PASSWORD)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}


export function decryptCTR(text){
  let PASSWORD = '3zTvzr3p67VC61jmV54rIYu1545x4TlY'
  var decipher = crypto.createDecipher(algorithmCTR,PASSWORD);
  var dec;
  try{
    dec = decipher.update(text,'hex','utf8')
    dec += decipher.final('utf8');
  }catch(e){
    console.error(e);
  }

  return dec;
}*/
