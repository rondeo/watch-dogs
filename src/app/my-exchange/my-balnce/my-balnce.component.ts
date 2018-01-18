import { Component, OnInit } from '@angular/core';
import {ConnectorApiService} from "../services/connector-api.service";

@Component({
  selector: 'app-my-balnce',
  templateUrl: './my-balnce.component.html',
  styleUrls: ['./my-balnce.component.css']
})
export class MyBalnceComponent implements OnInit {

  constructor(
    private apiService:ConnectorApiService
  ) { }

  ngOnInit() {
    console.log(this.apiService.getExchangeName())
  }

}
