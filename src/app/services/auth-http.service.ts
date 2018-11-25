import {Injectable} from '@angular/core';


import {
  Http,
  Response,
  RequestOptions,
  CookieXSRFStrategy,
  XSRFStrategy,
  ResponseContentType,
} from '@angular/http';
import {ActivatedRoute, Router} from '@angular/router';
/*import {HDNode} from 'bitcoinjs-lib';*/
import {StorageService} from './app-storage.service';
import {VOResult} from '../models/app-models';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';


@Injectable()
export class AuthHttpService {
  // isLogedIn$: Observable<boolean>

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private storage: StorageService
  ) {

    this.userSub = new BehaviorSubject<VOUser>(null);
    // this.user$ = this.userSub.asObservable();

    this.isLogedInSub = new BehaviorSubject(null);

    this.isOnlineSub = new BehaviorSubject(window.navigator.onLine);
    window.addEventListener('online', () => {

      this.isOnlineSub.next( true);
    });

    window.addEventListener('offline', () => {
      this.isOnlineSub.next( false);
    });
    // setTimeout(() => this.autoLogin(), 2000);
  }
  headers: Headers;

  private userSub: BehaviorSubject<VOUser>;
  // user$: Observable<VOUser>;
  private user: VOUser = null;
  isLogedInSub: BehaviorSubject<boolean>;

  isOnlineSub: BehaviorSubject<boolean>;

  async autoLogin() {
  /*  let user = {} // await this.storage.restoreUserSimple();
    console.warn(user);
    let password2 =  '' // this.storage.hashPassword1(user.p);
    return this.login(user.u, password2).map((result: any) =>{
      if(result.success ==='logedin'){
        this.setUser(result.user);
      }
      return user;
    })*/
  }

  isOnline$() {
    return this.isOnlineSub.asObservable();
  }

    isLogedIn(): boolean {
    return !!this.user;
  }
  getUserEmail(): string {
    return this.user.email;
  }

  login(email: string, password: string) {


    // let sub: Subject<VOUser> = new Subject();

    let url = '/api/login/login';
    console.log(url);
    return this.http.post(url, {email: email, password: password});


    // return sub.asObservable();
  }

  register(email: string, password: string) {
    let url = 'api/login/register';
    return this.http.post(url, {email: email, password: password});
      // .shareReplay().map(res => res.json())

      // .do(user => this.userSub.next(user))
  }

 /* autoLogin(): void {


    let lastVisited = this.getLastVisited();

    let user = this.getUser();

    //console.log(user);
    this.user = user
    this.dispatchUser();
    if (user && lastVisited && lastVisited !== 'undefined') {
     // console.warn(lastVisited);
      //this.router.navigate([lastVisited]);
    }

  }
*/

  dispatchUser(): void {
    this.userSub.next(this.user);
    // this.isLogedInSub.next((this.user !== null));
  }

  logout() {
    return this.post('/api/login/logout', this.user);
  }


  getToken(): string {
    let user: VOUser = this.getUser();
    return user ? user.token : null;
  }

  getUser$() {

    return this.userSub.asObservable();
  }

  getUser(): VOUser {

    if (!this.user) {

      let str = this.storage.getItem('authentication');

      if (str) {
            //  try {
            //  this.user = JSON.parse(atob(str));
              // /   new VOUser(JSON.parse(atob(str)));
           // } catch (e) {
           //   console.error(e);
              // this.removeAuthentication();
           // }

      }
    }
    return this.user;
  }

  removeAuthentication(): void {
    this.storage.removeItem('authentication');
    // this.user = null;
    // this.userSub.next(null);
  }

  saveUser() {
    this.storage.setItem('authentication', btoa(JSON.stringify(this.user)));
  }


  getHeaders(): any {
    if (!this.headers) {
      this.headers = new Headers();
      let token: string = this.getToken();
      // console.log('token' , token);

      if (token) {
        this.headers.append('Authorization', token);
        // this.headers.append('token', token);
      }
      // this.headers.append('withCredentials','true');
    }
    return this.headers;
  }

  addHeaders(options: any): any {
    if (options) options.headers ? options.headers.append('Authorization', this.getToken()) : options.headers = this.getHeaders();
    else options = {headers: this.getHeaders(), withCredentials: true};
    // console.log(options);
    return options;
  }

  public get(url: string): Observable<any> {

    return this.http.get(url).pipe(map(res => {
      return res;
    })); // , this.addHeaders(options));
  }

  public post(url: string, body: any) {
    return this.http.post(url, body);
  }

  public put(url: string, body: any): Observable<any> {
    return this.http.put(url, body);
  }

  /*public delete(url: string, options?: RequestOptions): Observable<Response> {
    return this.http.delete(url, this.addHeaders(options));
  }

  public patch(url: string, body: any, options?: RequestOptions): Observable<Response> {
    return this.http.patch(url, this.addHeaders(options));
  }

  public head(url: string, options?: RequestOptions): Observable<Response> {
    return this.http.head(url, this.addHeaders(options));
  }

  public options(url: string, options?: RequestOptions): Observable<Response> {
    return this.http.options(url, this.addHeaders(options));
  }
*/
  /*public get(url: string, options?: RequestOptions): Observable<Response> {

    return this.http.get(url, this.addHeaders(options));
  }

  public post(url: string, body: any, options?: RequestOptions): Observable<Response> {
    return this.http.post(url, body, this.addHeaders(options));
  }

  public put(url: string, body: any, options?: RequestOptions): Observable<Response> {
    return this.http.put(url, body, this.addHeaders(options));
  }

  public delete(url: string, options?: RequestOptions): Observable<Response> {
    return this.http.delete(url, this.addHeaders(options));
  }

  public patch(url: string, body: any, options?: RequestOptions): Observable<Response> {
    return this.http.patch(url, this.addHeaders(options));
  }

  public head(url: string, options?: RequestOptions): Observable<Response> {
    return this.http.head(url, this.addHeaders(options));
  }

  public options(url: string, options?: RequestOptions): Observable<Response> {
    return this.http.options(url, this.addHeaders(options));
  }*/

  setLastVisited(url?: string) {
    if (!url) url = this.router.url;
    localStorage.setItem('lastVisited', url);
  }

  getLastVisited(): string {
    return localStorage.getItem('lastVisited');
  }

  setUser(user: VOUser) {
    this.user = user;
    this.saveUser();
    if (user && user.session) this.isLogedInSub.next(true);
    else this.isLogedInSub.next(false);
    this.dispatchUser();
  }

  setUserNickname(nickname: string) {
    this.user.nickname = nickname;
    this.saveUser();
    this.dispatchUser();
  }
}


export interface VOUser {
  id: string;
  nickname: string;
  email: string;
  password: string;
  token: string;
  session: string;
  uid: string;
}
