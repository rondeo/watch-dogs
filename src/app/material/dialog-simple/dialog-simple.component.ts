import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material';

@Component({
  selector: 'app-dialog-simple',
  templateUrl: './dialog-simple.component.html',
  styleUrls: ['./dialog-simple.component.css']
})
export class DialogSimpleComponent implements OnInit {
  buttons:string[] = ['OK'];
  title:string = 'Alert';
  message:string = 'Message';

  constructor(@Inject(MAT_DIALOG_DATA) public data: DilaogData) {
    if(data.buttons) this.buttons = data.buttons;
    if(data.title) this.title = data.title;
    this.message = data.message;
  }

  ngOnInit() {

  }

}


export interface DilaogData{
  title:string;
  message:string;
  buttons?:string[];
}
