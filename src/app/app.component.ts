import {Component, OnInit} from '@angular/core';
//import {AuthHttp} from './libs/angular2-jwt';
import {Router} from '@angular/router';
import {Http} from '@angular/http';
import {AuthHttpService, VOUser} from './services/auth-http.service';
import {MatDialog, MatSnackBar} from '@angular/material';
import {LoginFormComponent} from './shared/login-form/login-form.component';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import {StorageService} from './services/app-storage.service';
import {MarketCapService} from "./market-cap/market-cap.service";

@Component({
  selector: 'app-root',
  templateUrl:'app.component.html'
})
export class AppComponent implements OnInit {
  title = 'app works!';
  menu:any;
  isLogedIn:boolean;
  nickname:string;
  countDown:number;
  historyCounter:number;


  isMenu:boolean

  constructor(
    private auth:AuthHttpService,
    private storage:StorageService,
    private router:Router,
    private dialog:MatDialog,
    private marketCap:MarketCapService,
    private snackBar:MatSnackBar
  ){

   /* console.log = function () {
      
    }
*/
   // this.isLogedIn$ = storage.

   /* router.events.subscribe((val) => {

      console.log(val);
     // console.log(val instanceof NavigationEnd)
    });
*/
  }

  onRefreshClick(){
    this.marketCap.refresh();

  }
  onLogin(){
   let ref =  this.dialog.open(LoginFormComponent,{
      width:'300px',
      height:'300px'
    })

    ref.afterClosed().subscribe(data=>{

      if(data && data.email && data.password){

        let salt = this.storage.hashPassword1(data.password);
        let password = this.storage.hashPassword1(salt);

        this.auth.login(data.email, password).toPromise().then((res:any)=>{
          console.log(res);
          this.auth.setUser(res.user);

        });
        this.storage.setSalt(data.email, salt);

        if(data.save) this.storage.storeUserSimple(data.email, salt);
      }


    })
  }

  onLogout(){
    if(confirm('You want to logout from Application')){
      this.auth.logout().toPromise().then(res=>{
        console.log(res);
        if(res.success) this.auth.setUser(null);
        else this.snackBar.open( res.message,'x', {extraClasses:['alert-red']});
      }).catch(err=>{
        this.snackBar.open( 'Connection error','x', {extraClasses:['alert-red']});
      });
    }

  }

  onClearStorage(){
    if(confirm('You want to delete all data from storage?')){
      localStorage.clear();
    }
  }
  ngOnInit():void{

    this.storage.onSalt().subscribe(salt=>{

    })

    this.marketCap.countDown$.subscribe(r=>this.countDown = r);

    this.marketCap.historyCounter$.subscribe(r=>this.historyCounter = r);


    let user =  this.storage.restoreUserSimple();

    console.log(user);
    if(user && user.u && user.p){
      this.storage.setSalt( user.u, user.p);

      let password2 = this.storage.hashPassword1(user.p);
      this.auth.login(user.u,password2).toPromise().then((res:any)=>{
        // console.log(' autologin ', res);
        if(res.success){
          this.snackBar.open(res.message, 'x', {duration:2000, extraClasses:['alert-green']});
          this.auth.setUser(res.user)
        } else this.snackBar.open( res.message,'x', {extraClasses:['alert-red']});


      }).catch(err=>{
        this.snackBar.open( 'Connection error','x', {extraClasses:['alert-red']});

      });


    }




    this.auth.getUser$().subscribe(user=> {
      this.nickname = user?user.nickname:'';
      this.isLogedIn = !!user
    });


 /*   this.http.authError.subscribe((err:any)=>{
      console.warn(err);
      this.router.navigateByUrl('/login');
    });
*/
    /*this.menu = this.http.get('http://localhost:8090/api/menu/1').map(res=>{

      console.log(res.json().menu);
      return res.json().menu;
    })*/


  }

  onDogClick(){
    this.isMenu = !this.isMenu;
  }
}
