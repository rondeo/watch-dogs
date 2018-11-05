import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material';
import {DilaogData} from '../../material/dialog-simple/dialog-simple.component';

@Component({
  selector: 'app-notes-history',
  templateUrl: './notes-history.component.html',
  styleUrls: ['./notes-history.component.css']
})
export class NotesHistoryComponent implements OnInit {

  history: string[];
  market: string;
  result: string;
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
   this.market = data.market;
   this.result = data.result;
   this.history = Object.values(data.history);

  }

  ngOnInit() {
  }

}