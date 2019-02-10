import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.css']
})
export class LoginFormComponent implements OnInit {

  showPass = false;

  login = {email: '', password: '', save: true};

  @ViewChild('savepass') savepass;

  constructor(
    private dialogRef: MatDialogRef<{ apiKey: string, password: string, save: boolean }>
  ) {
  }

  ngOnInit() {
  }

  checkPassword() {

  }

  onShowPasswordChanged(evt, on) {
    this.showPass = on.checked;
  }

  onSubmit() {
    this.login.save = !this.savepass.checked;
    this.dialogRef.close(this.login);
  }

}
