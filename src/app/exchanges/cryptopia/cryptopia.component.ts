import { Component, OnInit } from '@angular/core';
import {CryptopiaService, VOCtopia} from '../services/cryptopia.service';

@Component({
  selector: 'app-cryptopia',
  templateUrl: './cryptopia.component.html',
  styleUrls: ['./cryptopia.component.css']
})
export class CryptopiaComponent implements OnInit {

  coinsAr:VOCtopia[];
  constructor(
    private ctopia:CryptopiaService
  ) { }

  ngOnInit() {
    this.ctopia.getCurrencies().subscribe(res=>{
     /// console.log(res)
      this.coinsAr = res;
    })
  }

}
