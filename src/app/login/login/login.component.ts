///<reference path="../../services/auth-http.service.ts"/>
import { Component, OnInit } from '@angular/core';
import {FormGroup} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthHttpService} from '../../services/auth-http.service';
import {element} from 'protractor';
import {DialogSimpleComponent} from '../../shared/dialog-simple/dialog-simple.component';
import {MatDialog, MatSnackBar} from '@angular/material';
import {StorageService} from "../../services/app-storage.service";



@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  showPass: boolean;
  login = {email: '', password: '', nickname:null};
  selectedTab:number;
  exists:boolean;
  notMatch:boolean = true;

  confirmPassword:string;


  constructor(
    private router:Router,
    private route:ActivatedRoute,
    private authHttp:AuthHttpService,
    private storage:StorageService,
    private dialog:MatDialog,
    private snakBar:MatSnackBar
  ) {

  }

  onRegister(){
    this.exists = false;

    let password = this.storage.hashPassword2(this.login.password)
    this.authHttp.register(this.login.email, password).subscribe((res:any)=>{
      console.log(res);
      if(res.success && res.nickname){

        this.snakBar.open( 'Registered ' + res.message,'x', {extraClasses:['alert-green']});

      }else{

        if(res.error && res.error ==='exists'){
          this.router.navigateByUrl('/login/login');
        }

        this.snakBar.open((res.nickname || '') + ' '+ res.message, 'x', {extraClasses:['alert-red']});
      }

    }, error=>{
      this.snakBar.open( 'Connection error','x', {extraClasses:['alert-red']});
    })
  }

  checkPassword(){

    if(this.confirmPassword === this.login.password) this.notMatch = false;
    else this.notMatch = true;
  }

  ngOnInit() {
    this.route.params.subscribe(params => {

      let topic = params.topic;
      console.log(topic);
      if(topic) {

        switch (topic){
          case 'sign-in':
            this.selectedTab = 0;
            break
          case 'forgot-password':
            this.selectedTab = 2;
            break
          case 'register':
            this.selectedTab = 1;
            break;
          case 'nickname':
            this.selectedTab = 3;
            break;
          default:
            this.selectedTab = 0;
            break;
        }
      }
      console.log(this.selectedTab);
    });

  }

  onShowPasswordChanged($evt, chbox){

    this.showPass = chbox.checked;

  }

  onLogin(){

    let password = this.storage.hashPassword2(this.login.password);
    this.authHttp.login(this.login.email, password).subscribe((res:any) => {
      console.log(res);


      this.snakBar.open( res.message,'x');
      if(res.success) {
        let url = this.storage.getLastVisitedUrl();
        if (!url) url = '/email-service';

        this.storage.setSalt(this.login.email, this.storage.hashPassword1(this.login.password));
        this.authHttp.setUser(res.user);

        setTimeout(() => {
          this.router.navigateByUrl(url)
        }, 3000);
      }else this.snakBar.open( res.message,'x', {extraClasses:['alert-red']});

    }, error=>{
      this.snakBar.open( 'Connection error','x', {extraClasses:['alert-red']});
    });
  }

  signUp() {

    console.log("Sign Up Data:" , this.login);
  }

  onNicknameOK(){
   // console.log(this.selectedTab);
    this.selectedTab = 0;
   // console.log(this.selectedTab);
   // this.router.navigateByUrl('/login/login');
  }

  onRequestNewNickname(){
    let url = 'api/login/new-nickname';
    let password = this.storage.hashPassword2(this.login.password);
    let out = {
      email:this.login.email,
      password:password,
      nickname:this.login.nickname
    }
    this.authHttp.post(url, out).subscribe(res=>{
      console.log(res);
      this.snakBar.open(res.message,'x');
      if(res.success){

        this.authHttp.setUserNickname(this.login.nickname)
      }

    }, err=>{
      this.snakBar.open( 'Connection error','x', {extraClasses:['alert-red']});
    })
  }


  onLogout(){
    if(confirm('You want to logout from email service?')){
      this.authHttp.logout().subscribe(res=>{

        if(res.success){
          this.authHttp.setUser(null);
          this.snakBar.open( res.message,'x', {extraClasses:['alert-green']});
        }else  this.snakBar.open( res.message,'x');

      }, error=>{
        this.snakBar.open( 'Connection error','x', {extraClasses:['alert-red']});
      })
    }
  }

  onRestPassword(){
    let url = 'api/login/reset-password';
    this.authHttp.post(url, this.login).subscribe(res=>{
      console.log(res);
      if(res.success){
        this.dialog.open(DialogSimpleComponent,{data:{
          title:'Alert',
          message:res.message
        }});

      }else{

        this.snakBar.open( res.message,'x');
      }
    }, err=>{
      console.log(err);
      this.snakBar.open( 'Connection error','x', {extraClasses:['alert-red']});
    })

  }
}

