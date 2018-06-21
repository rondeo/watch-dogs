import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';

@Component({
  selector: 'app-login-exchange',
  templateUrl: './login-exchange.component.html',
  styleUrls: ['./login-exchange.component.css']
})
export class LoginExchangeComponent implements OnInit {

  showPass = false;
  exchange: string;

  login = {apiKey: '', password: ''};

  @ViewChild('savepass') savepass;

  constructor(
    private dialogRef: MatDialogRef<{ apiKey: string, password: string }>,
    @Inject(MAT_DIALOG_DATA) public data: {exchange: string}
  ) {
  }

  ngOnInit() {
    this.exchange = this.data.exchange;
  }

  onShowPasswordChanged(evt, on) {
    this.showPass = on.checked;
  }

  onSubmit() {
   //  this.login.save = !this.savepass.checked;
    this.dialogRef.close(this.login);
  }

}
