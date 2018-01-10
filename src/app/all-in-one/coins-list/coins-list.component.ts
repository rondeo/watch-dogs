import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {StorageService} from "../../services/app-storage.service";

@Component({
  selector: 'app-coins-list',
  templateUrl: './coins-list.component.html',
  styleUrls: ['./coins-list.component.css']
})
export class CoinsListComponent implements OnInit {


  mcSelected:string[];

  constructor(
    private router: Router,
    private storage:StorageService
  ) { }

  ngOnInit() {
    let mcselected = this.storage.getSelectedMC();
    this.mcSelected = mcselected;
  }


  closePopup() {

    console.log('close')
    this.router.navigate([{ outlets: { popup: null }}]);
  }

  onCcloseClick() {
    this.closePopup();
  }
}
