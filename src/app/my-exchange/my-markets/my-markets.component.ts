import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {ConnectorApiService} from "../services/connector-api.service";



@Component({
  selector: 'app-my-markets',
  templateUrl: './my-markets.component.html',
  styleUrls: ['./my-markets.component.css']
})
export class MyMarketsComponent implements OnInit {

  constructor(
    private route:ActivatedRoute,
    private apiService:ConnectorApiService
  ) { }

  ngOnInit() {

    let ex =this.route.snapshot.paramMap;
    console.log(ex);
  }

}
