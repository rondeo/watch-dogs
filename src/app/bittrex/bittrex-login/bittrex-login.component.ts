import {AfterViewInit, Component, Inject, OnInit, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';

@Component({
  selector: 'app-bittrex-login',
  templateUrl: './bittrex-login.component.html',
  styleUrls: ['./bittrex-login.component.css']
})
export class BittrexLoginComponent implements OnInit, AfterViewInit{

  @ViewChild('savepass') savepass
  credetials:{apiKey:string, password:string, save:boolean, submit:boolean};// = {apiKey:'', password:'', save:false};
  constructor(
   @Inject(MAT_DIALOG_DATA) private data: {apiKey:string, password:string, save:boolean, submit:boolean},
    private dialogRef: MatDialogRef<{apiKey:string, password:string, save:boolean, submit:boolean}>
  ) {
    this.credetials = data;

  }

  ngAfterViewInit(){



  }

  ngOnInit() {
    this.savepass.checked = this.credetials.save

  }

  onSubmit(){
    this.credetials.save = !this.savepass.checked;
    this.credetials.submit = true;
    this.credetials.apiKey = this.credetials.apiKey.trim();
    this.credetials.password = this.credetials.password.trim();

    this.dialogRef.close(this.credetials);
  }


  saveData(chbox){
   // this.credetials.save = chbox.checked;
  }

}
