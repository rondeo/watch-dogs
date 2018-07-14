import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {VOMCAgregated} from '../../models/api-models';
import {VOMarketCap} from '../../models/app-models';

@Component({
  selector: 'app-mc-data',
  templateUrl: './mc-data.component.html',
  styleUrls: ['./mc-data.component.css']
})
export class McDataComponent implements OnInit, OnChanges {

  @Input() mcdata: VOMarketCap = new VOMarketCap();
  constructor() { }

  ngOnInit() {
   // if(!this.mcdata) this.mcdata = new VOMCAgregated()
  }
  ngOnChanges(evt) {
    console.log(evt);
  }

}
