import {Component, OnDestroy, OnInit} from '@angular/core';
import {MyPrivateServiceService} from "../my-private-service.service";
import {ActivatedRoute, Router} from "@angular/router";
import {MatDialog, MatSnackBar} from "@angular/material";
import {StorageService} from "../../services/app-storage.service";
import {BittrexLoginComponent} from "../../bittrex/bittrex-login/bittrex-login.component";
import {Subject} from "rxjs/Subject";
import {VOBalance} from "../../models/app-models";

@Component({
  selector: 'app-my-balances',
  templateUrl: './my-balances.component.html',
  styleUrls: ['./my-balances.component.css']
})
export class MyBalancesComponent implements OnInit, OnDestroy {


  exchangeName:string;
  balancesAr:VOBalance[];
  data:VOBalance[];
  total:string;
  isShowAll:boolean = true;

  constructor(
    private route:ActivatedRoute,
    private dialog:MatDialog,
    private storage:StorageService,
    private snackBar:MatSnackBar,
    private router:Router
  ) { }


  private sub1;
  private sub2;
  ngOnInit() {

    let exchange = this.route.snapshot.paramMap.get('exchange');
    console.log(exchange)

    //if(!hasKey) setTimeout(()=> this.pleaseLogin(), 2000);
    //this.privateService.refreshBalances();

  }

  ngOnDestroy(){
    this.sub1.unsubscribe();
    this.sub2.unsubscribe();
  }



  initService(id:string){





  }
  pleaseLogin(){

  }




  private render(){

  }

  onShowAll(evt){

  }



  refresh(){

  }


  onTransferClick(balance: VOBalance) {

    //balance.isDetails = !balance.isDetails;
  }



  onShowCartClick(balance: VOBalance) {

  }


}
