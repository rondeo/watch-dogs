import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MatSnackBar} from '@angular/material';
import {HttpClient} from '@angular/common/http';
import {VOLoginResult} from '../../amodels/app-models';
import {StorageService} from '../../a-core/services/app-storage.service';
import {AuthHttpService} from '../../a-core/services/auth-http.service';

@Component({
  selector: 'app-confirm-reset-password',
  templateUrl: './confirm-reset-password.component.html',
  styleUrls: ['./confirm-reset-password.component.css']
})
export class ConfirmResetPasswordComponent implements OnInit {

  message: string;
  login: {password: string, session: string} = {password: '', session: ''};
  notMatch = true;
  confirmPassword: string;
  showPass = false;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private snakBar: MatSnackBar,
    private storage: StorageService,
    private auth: AuthHttpService
  ) { }


  ngOnInit() {

    this.route.params.subscribe(params => {
      console.log(params);
      this.login.session = params.session;

    });

  }

  onSubmit() {

    let url = 'api/login/reset-password-confirm/';
   /* let password = this.storage.hashPassword(this.login.password)
    this.http.post(url,{session:this.login.session, password:password}).subscribe((res:VOLoginResult)=>{
      this.snakBar.open(res.message, 'x');
      if(res.success){
        setTimeout(()=>{
          this.router.navigateByUrl('/login/login');
        }, 3000);
      }

    })*/

  }

  checkPassword() {

    if (this.confirmPassword === this.login.password) this.notMatch = false;
    else this.notMatch = true;
  }

  onShowPasswordChanged($evt, chbox) {

    this.showPass = chbox.checked;

  }

}
