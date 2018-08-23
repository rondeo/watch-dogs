import {Component, Input, OnInit} from '@angular/core';
import {VOMarketCap} from "../../models/app-models";

@Component({
  selector: 'app-mc-percent',
  templateUrl: './mc-percent.component.html',
  styleUrls: ['./mc-percent.component.css']
})
export class McPercentComponent implements OnInit {

  @Input() marketcap:VOMarketCap = new VOMarketCap();

  constructor() { }

  ngOnInit() {
  }

}
