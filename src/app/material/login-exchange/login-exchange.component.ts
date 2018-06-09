import {Component, OnInit, ViewChild} from '@angular/core';
import {MatDialogRef} from '@angular/material';

@Component({
  selector: 'app-login-exchange',
  templateUrl: './login-exchange.component.html',
  styleUrls: ['./login-exchange.component.css']
})
export class LoginExchangeComponent implements OnInit {

  showPass = false;

  login = {apiKey: '', password: ''};

  @ViewChild('savepass') savepass;

  constructor(
    private dialogRef: MatDialogRef<{ apiKey: string, password: string }>
  ) {
  }

  ngOnInit() {
  }

  onShowPasswordChanged(evt, on) {
    this.showPass = on.checked;
  }

  onSubmit() {
   //  this.login.save = !this.savepass.checked;
    this.dialogRef.close(this.login);
  }

}
