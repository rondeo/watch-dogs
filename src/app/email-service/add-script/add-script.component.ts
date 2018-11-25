import {Component, Input, OnInit} from '@angular/core';
import {MatSnackBar} from '@angular/material';

@Component({
  selector: 'app-add-script',
  templateUrl: './add-script.component.html',
  styleUrls: ['./add-script.component.css']
})
export class AddScriptComponent implements OnInit {


  percent_change_1hLess;
  percent_change_1h = 0;

  @Input() scripAr: string[];

  constructor(private snackBar: MatSnackBar) { }

  ngOnInit() {
  }


  onDeleteScriptClick(i: number) {
    this.scripAr.splice(i, 1);
  }

  onEditScriptClick(i: number) {
    const script = this.scripAr[i];
    const signLess = script.indexOf('<');
    const signMore = script.indexOf('>');
    let value;
    if (signLess !== -1) {
      this.percent_change_1hLess = true;
      value = script.substring(signLess + 1, script.indexOf(')'));
    } else if (signMore !== -1) {
      this.percent_change_1hLess = false;
      value = script.substring(signMore + 1, script.indexOf(')'));
    } else console.error(script);

    this.percent_change_1h = +value;
  }

  onAddSellScriptClick() {
    if (isNaN(this.percent_change_1h)) {
      this.snackBar.open('SET percent change 1h', 'x', {duration: 1000});
      return;
    }
    const script = 'if(percent_change_1h  ' + (this.percent_change_1hLess ? '<' : '>')
      + ' ' + this.percent_change_1h + ')  { SELL(percent_change_1h) }';

    this.scripAr.push(script);
    // console.log(this.watchDog.sellScripts);
    // this.initScripts();
  }

  onMinusSellScriptClick() {
    if (this.percent_change_1h) this.percent_change_1h = -this.percent_change_1h;
  }

  onPercent1hLess() {
    this.percent_change_1hLess = !this.percent_change_1hLess;

  }

}
