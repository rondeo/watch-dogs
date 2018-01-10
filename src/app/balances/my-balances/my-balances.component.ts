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
    private privateService:MyPrivateServiceService,
    private route:ActivatedRoute,
    private dialog:MatDialog,
    private storage:StorageService,
    private snackBar:MatSnackBar,
    private router:Router
  ) { }


  private sub1;
  private sub2;
  ngOnInit() {

    let id = this.route.snapshot.paramMap.get('exchange');
    setTimeout(()=> this.initService(id), 1000);


    this.sub1 =  this.privateService.name$().subscribe(r=>{
      console.warn(r);
      this.exchangeName = r
    });
    //if(!hasKey) setTimeout(()=> this.pleaseLogin(), 2000);
    //this.privateService.refreshBalances();

  }

  ngOnDestroy(){
    this.sub1.unsubscribe();
    this.sub2.unsubscribe();
  }



  initService(id:string){

    this.privateService.initService({exchange:id});;//.subscribe(isLogedin=>{


    let sub1 =  this.privateService.isSignedIn$().subscribe(res=>{
      console.warn(res);

      if(res) this.privateService.refreshBalances();

    })
    this.privateService.autoLogin();

    this.sub2 =  this.privateService.balances$().subscribe(res=>{
      //console.log ('balances res', res);
      this.data = res;
     this.render();
      //this.parceMarketCap();

    });
    // this.bitrexService.loadBalances();


    // this.isLogedin = isLogedin;

     // if(!this.isLogedin) setTimeout(()=> this.pleaseLogin(), 2000);
      //else this.privateService.refreshBalances()
     // setTimeout(()=>sub1.unsubscribe(), 50);
   // })




  }
  pleaseLogin(){
    // let str = this.storage.getItem('Bittrex-credetials', true);

    /* if(!this.storage.isLoggedIn()){
       alert('Please provide Security Login first!')
       return
     }*/



    let credentials = {apiKey:'', password:'', save:false, submit:false};

    let dialogRef = this.dialog.open(BittrexLoginComponent,{
      data:credentials
    });

    let sub =  dialogRef.afterClosed().subscribe(result => {
      if(!result) return;
      sub.unsubscribe();
      console.log(result);



      if(result.apiKey.length && result.password.length && result.submit) {

        this.privateService.login(result.apiKey, result.password, result.save);
        if(!result.save) this.privateService.removeSavedLogin();
      }


    });

  }




  private render(){
    if(!this.data) return;

    let ar:VOBalance[];

    if(this.isShowAll){
      ar = this.data;
    }else  ar = this.data.filter(function (item) {
      return +item.balance !==0;
    });

    this.total  = ar.reduce(function (a, b) {  return a+ +b.balanceUS; },0).toFixed(2);
    this.balancesAr = ar.sort(function (a, b) { return +a.balanceUS > +b.balanceUS?-1:1; });
  }

  onShowAll(evt){
    this.isShowAll = evt.checked;
    this.render()
  }



  refresh(){
    this.privateService.refreshBalances();

  }


  onTransferClick(balance: VOBalance) {
    this.router.navigateByUrl('/my-bittrex/transfer/'+ balance.symbol);
    //balance.isDetails = !balance.isDetails;
  }



  onShowCartClick(balance: VOBalance) {
    //let mc = this.marketCap.getCoinBySymbol(balance.symbol);
    //if (mc) window.open('https://coinmarketcap.com/currencies/' + mc.id, '_blank');

    if (balance.id)  window.open('https://coinmarketcap.com/currencies/' +balance.id, '_blank');
    else console.warn(' no id for ' + balance.symbol);
  }


}
