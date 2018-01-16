import { Component, OnInit } from '@angular/core';
import { VOCtopia} from '../services/cryptopia.service';

@Component({
  selector: 'app-cryptopia',
  templateUrl: './cryptopia.component.html',
  styleUrls: ['./cryptopia.component.css']
})
export class CryptopiaComponent implements OnInit {

  coinsAr:VOCtopia[];
  constructor(

  ) { }

  ngOnInit() {

  }

}
