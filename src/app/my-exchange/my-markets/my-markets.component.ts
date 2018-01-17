import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {ApiServiceService} from "../services/api-service.service";


@Component({
  selector: 'app-my-markets',
  templateUrl: './my-markets.component.html',
  styleUrls: ['./my-markets.component.css']
})
export class MyMarketsComponent implements OnInit {

  constructor(
    private route:ActivatedRoute,
    private apiService:ApiServiceService
  ) { }

  ngOnInit() {

    let ex =this.route.snapshot.paramMap;
    console.log(ex);
  }

}
