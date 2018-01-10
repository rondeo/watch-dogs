import { Component, OnInit } from '@angular/core';
import {BittrexLoginComponent} from "../../bittrex/bittrex-login/bittrex-login.component";
import {MatDialog, MatSnackBar} from "@angular/material";
import {StorageService} from "../../services/app-storage.service";
import {MyPrivateServiceService} from "../my-private-service.service";

@Component({
  selector: 'app-balances-main',
  templateUrl: './balances-main.component.html',
  styleUrls: ['./balances-main.component.css']
})
export class BalancesMainComponent implements OnInit {

  isHasPassword:boolean;
  constructor(
    private dialog:MatDialog,
    private storage:StorageService,
    private snackBar:MatSnackBar,
    private privateService:MyPrivateServiceService
  ) { }

  ngOnInit() {

    this.privateService.isSignedIn$().subscribe(res=>{
      console.warn(res);
      this.isHasPassword = res;
    });

  }

  pleaseLogin(){


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
        /*this.privateService.login(result.apiKey, result.password, result.save);
        if(!result.save) this.privateService.removeSavedLogin();
      }*/
      }

    });

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
