import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {AuthHttpService} from '../../services/auth-http.service';
import {MatSnackBar} from '@angular/material';
import {StorageService} from "../../services/app-storage.service";

@Component({
  selector: 'app-email-main',
  templateUrl: './email-main.component.html',
  styleUrls: ['./email-main.component.css']
})
export class EmailMainComponent implements OnInit, OnDestroy {


  isLoggedIn$:Observable<boolean>;
  constructor(
    private auth:AuthHttpService,
    private snackBar:MatSnackBar,
    private storage:StorageService
  ) {

    //this.isLoggedIn$ = auth.isLogedIn$;
  }

  private sub1;
  ngOnInit() {
    this.sub1 = this.storage.onSalt().subscribe(res=>{

    })

  }
  ngOnDestroy(){
    this.sub1.unsubscribe();
  }

  /*onLoginClick(){

  }*/


  onLogoutClick(){
    if(confirm('You want to logout from Email Service?')) {

      this.auth.logout().subscribe(res=>{
        let color = res.error?'red':'black';

        this.snackBar.open(res.message,'x');
      })
    }

  }
}
