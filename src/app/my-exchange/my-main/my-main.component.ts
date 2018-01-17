import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";

import {BittrexLoginComponent} from "../../bittrex/bittrex-login/bittrex-login.component";
import {MatDialog, MatSnackBar} from "@angular/material";
import {Subscription} from "rxjs/Subscription";
import {ConnectorApiService} from "../services/connector-api.service";

@Component({
  selector: 'app-my-main',
  templateUrl: './my-main.component.html',
  styleUrls: ['./my-main.component.css']
})
export class MyMainComponent implements OnInit {


  exchange:string;
  isLogedIn:boolean;
  constructor(
    private route:ActivatedRoute,
    private router:Router,
    private apiService:ConnectorApiService,
    private snackBar:MatSnackBar,
    private dialog:MatDialog
  ) { }

  private sub1:Subscription;
  private subLogin:Subscription;

  ngOnInit() {
    this.sub1 = this.route.params.subscribe(params=>{
      let exchange = params.exchange;
      console.log(params);
      this.exchange = exchange;
      if(exchange){

        this.apiService.setExchange(exchange);

       if(this.subLogin) this.subLogin.unsubscribe();
        this.subLogin = this.apiService.isLogedIn$.subscribe(login=>{
          this.isLogedIn = login;
          if(!login) return;

          /* this.privateService.withdrawHistory().toPromise().then(res=>{
             let local = this.storage.getItem('bittrex-withdraw');
             if(!!local) {
               let localdata = JSON.parse(local);
               if(localdata.length !==res.length){
                 this.snackBar.open('New withdrawal ','x', {extraClasses:'alert-red'});
                 this.storage.setItem('bittrex-withdraw', JSON.stringify(res));
               }
             }else  this.storage.setItem('bittrex-withdraw', JSON.stringify(res));

           })*/

        })

      }

    });

    setTimeout(()=>this.showBar(), 2000);

  }

  ngOnDestroy(){
    if(this.sub1) this.sub1.unsubscribe();
    if(this.subLogin) this.subLogin.unsubscribe();
  }


  showBar(){


    if(!this.apiService.isLogedIn$) return;
    this.apiService.isLogedIn$.subscribe(res=>{
      let exchange = this.apiService.getExchangeName()
      if(res) this.snackBar.open('Logged in '+ exchange +' account', 'x', {duration:3000});
      else  this.snackBar.open(exchange + ' Login Required ' +'', 'x', {duration:3000});
    })
  }


  onLoginClick(){


    // let str = this.storage.getItem('Bittrex-credetials', true);

    /* if(!this.storage.isLoggedIn()){
       alert('Please provide Security Login first!')
       return
     }*/



    let credentials = {apiKey:'', password:'', save:false, submit:false};

    let dialogRef = this.dialog.open(BittrexLoginComponent,{
      data:credentials
    });

    let sub =  dialogRef.afterClosed().subscribe(result => {
      if(!result) return;
      sub.unsubscribe();
      console.log(result);
      if(result.apiKey.length && result.password.length && result.submit) {
        this.apiService.login(result.apiKey, result.password, result.save);
        if(!result.save) this.apiService.removeSavedLogin();
      }

    });

  }

  onLogoutClick(){

    let exchange = this.apiService.getExchangeName()
    if(confirm('Logout from '+exchange+'.')) this.apiService.logout();


  }

}
