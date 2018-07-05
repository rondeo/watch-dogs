import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {VOMCAgregated} from '../../models/api-models';

@Component({
  selector: 'app-mc-data',
  templateUrl: './mc-data.component.html',
  styleUrls: ['./mc-data.component.css']
})
export class McDataComponent implements OnInit, OnChanges {

  @Input() mcdata: VOMCAgregated = new VOMCAgregated();
  constructor() { }

  ngOnInit() {
   // if(!this.mcdata) this.mcdata = new VOMCAgregated()
  }
  ngOnChanges(evt) {
    console.log(evt);
  }

}