import { Component, OnInit } from '@angular/core';
import {AllCoinsService} from '../all-coins.service';

@Component({
  selector: 'app-all-balances',
  templateUrl: './all-balances.component.html',
  styleUrls: ['./all-balances.component.css']
})
export class AllBalancesComponent implements OnInit {

  constructor(
    private service:AllCoinsService
  ) { }

  ngOnInit() {


  }

}
