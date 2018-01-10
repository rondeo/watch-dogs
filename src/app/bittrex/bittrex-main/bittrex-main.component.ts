import { Component, OnInit } from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {BittrexPrivateService} from '../bittrex-private.service';
import {LoginFormComponent} from '../../shared/login-form/login-form.component';
import {MatDialog, MatSnackBar} from '@angular/material';
import {BittrexLoginComponent} from '../bittrex-login/bittrex-login.component';
import {StorageService} from '../../services/app-storage.service';

@Component({
  selector: 'app-bittrex-main',
  templateUrl: './bittrex-main.component.html',
  styleUrls: ['./bittrex-main.component.css']
})
export class BittrexMainComponent implements OnInit {

  isBittrexIn$:Observable<boolean>;


  isuserLogin$:Observable<boolean>;
  constructor(
    private privateService:BittrexPrivateService,
    private dialog:MatDialog,
    private storage:StorageService,
    private snackBar:MatSnackBar
  ) {



  }

  ngOnInit() {

    //this.isuserLogin$ = this.storage.isLogedIn$;

    this.isBittrexIn$ = this.privateService.isLoggedIn$;
    this.isBittrexIn$.subscribe(login=>{
      if(!login) return;
      this.privateService.withdrawHistory().toPromise().then(res=>{
        let local = this.storage.getItem('bittrex-withdraw');
        if(!!local) {
          let localdata = JSON.parse(local);
          if(localdata.length !==res.length){
            this.snackBar.open('New withdrawal ','x', {extraClasses:'alert-red'});
            this.storage.setItem('bittrex-withdraw', JSON.stringify(res));
          }
        }else  this.storage.setItem('bittrex-withdraw', JSON.stringify(res));

      })
    })

    this.storage.onSalt().subscribe(res=>{
      console.log(' on salt '+res);
      if(res){
        this.privateService.autoLogin();


      }
    })
    setTimeout(()=>this.shoBar(), 2000);
  }

  shoBar(){
    this.isBittrexIn$.subscribe(res=>{
      if(res) this.snackBar.open('Logged in Bitterx account', 'x', {duration:3000});
      else  this.snackBar.open('Logged Required', 'x', {duration:3000});
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
        this.privateService.login(result.apiKey, result.password, result.save);
        if(!result.save) this.privateService.removeSavedLogin();
      }

    });

  }

  onLogoutClick(){

    if(confirm('Logout from Bittrex.')) this.privateService.logout();


  }

}
