import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {DilaogData} from '../dialog-simple/dialog-simple.component';

@Component({
  selector: 'app-dialog-input',
  templateUrl: './dialog-input.component.html',
  styleUrls: ['./dialog-input.component.css']
})
export class DialogInputComponent implements OnInit {

  userInput: string;
  message: string;
  constructor(
    private dialogRef: MatDialogRef<{ userInput: string }>,
    @Inject(MAT_DIALOG_DATA) public data :{message: string, hint:string}) {
    this.message = data.message;
    this.userInput = data.hint;
  }

  ngOnInit() {

  }


  onOkClick() {
    const userInput = this.userInput;
    this.dialogRef.close({userInput});
  }

  onCancelClick(){
    this.dialogRef.close()
  }
}
