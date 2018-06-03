import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';

import {EmailServiceService} from '../email-service.service';
import {MatDialog, MatSnackBar} from '@angular/material';

import {ActivatedRoute} from '@angular/router';
import {runDogScript} from '../run-watchdogs/script-analytics';
import {VOMarketCap, VOWATCHDOG, VOWatchdog} from '../../models/app-models';
import {WatchDog} from '../../models/watch-dog';


@Component({
  selector: 'app-edit-script',
  templateUrl: './edit-script.component.html',
  styleUrls: ['./edit-script.component.css']
})
export class EditScriptComponent implements OnInit, AfterViewInit, OnDestroy {




  currentDog:WatchDog;

  variablesAvailable = [
    {label:'percent_change_1h',index:'percent_change_1h'},
    {label:'percent_change_24h',index:'percent_change_24h'},
    {label:'percent_change_7d',index:'percent_change_7d'},
    {label:'price_usd',index:'price_usd'},
    {label:'old_percent_change_1h',index:'old_percent_change_1h'},
    {label:'old_percent_change_24h',index:'old_percent_change_24h'},
    {label:'old_percent_change_7d',index:'old_percent_change_7d'},
    {label:'old_price_usd',index:'old_price_usd'},
  ]

  testVariables:{label:string, index:string, value:number}[] = [
    {label:'percent_change_1h',index:'percent_change_1h', value:10},
    {label:'percent_change_24h',index:'percent_change_24h', value:6},
    {label:'percent_change_7d',index:'percent_change_7d', value:5},
    {label:'price_usd',index:'price_usd', value:0.3}
  ];

  @ViewChild('scriptContent') scriptContent;


  constructor(
   // private coinsService:MarketCapSelectedService,
    private emailService:EmailServiceService,
    private dialog:MatDialog,
    private snakBar:MatSnackBar,
    private route:ActivatedRoute
  ) {

    this.currentDog = new WatchDog(VOWATCHDOG);
   // this.currentDog.marketCap = new VOMarketCap();
  }



  ngAfterViewInit() {

    // console.log();
  }


  ngOnInit() {

    this.sub2 = this.emailService.watchDogs$.subscribe(dogs=>{
      if(!dogs) return;
      console.log(dogs);

      if(this.currentDog.uuid) this.setCurrentDogByUid(this.currentDog.uuid);




      //this.setCurrentDog(dog);
    });

    this.sub1 = this.route.params.subscribe(params => {
      let uid = params['uid'];
      uid = uid.toUpperCase();
      this.currentDog.uuid = uid;
      if(this.emailService.getWatchDogs()) this.setCurrentDogByUid(uid);


    });
  }

  private sub1;
  private sub2;


  setCurrentDogByUid(uid){

    if(!this.emailService.marketCapData) return;



    let dog = this.emailService.getWatchDogs().find(function (item) {
      return item.uuid === uid;
    });

    if(dog) this.setCurrentDog(dog);
    else this.snakBar.open('Cant find dog '+uid, 'x');

  }

  ngOnDestroy() {
    this.sub1.unsubscribe();
    this.sub2.unsubscribe();
  }
  runScript(){
    let script = this.scriptContent.nativeElement.innerText.toString();
    this.innerHTML = this.scriptContent.nativeElement.innerHTML;

   // console.log(script);

    let ar = this.testVariables;
    let values={};
    let history ={};

    ar.forEach(function (item) {
      values[item.index] = +item.value;
    });



   let oldValue:any = {}

    let newValue:VOMarketCap = {
      id:oldValue.id,
      name: oldValue.name,
      symbol:oldValue.symbol,
      rank: oldValue.rank,
      price_usd:values['price_usd'],
      price_btc:values['price_btc'],
      percent_change_1h:values['percent_change_1h'],
      percent_change_24h:values['percent_change_24h'],
      percent_change_7d:values['percent_change_7d']
      };


    let results:string[] =  runDogScript(oldValue, newValue , script);
    console.log(results);

    if(results.length){
      let message = results.join('<br/>');
      let subject = this.currentDog.uuid + ' '+ this.currentDog.name +' '+this.currentDog.name ||'';
      this.emailService.sendNotification(subject, message).subscribe(res=>{
        console.log(res);

        if(res && res.message) this.snakBar.open(res.message, 'x', {duration:3000});

      });
    }
  }

  insertTextAtCursor(text) {
    var sel, range, html;

    console.log(window.getSelection);
    if (window.getSelection) {

      sel = window.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
        range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode( document.createTextNode(text) );
      }
    }/* else if (document.selection && document.selection.createRange) {
      document.selection.createRange().text = text;
    }*/
  }


  private range;
  private scriptValue:string;
  private innerHTML:string;


  onScriptContentBlur(content){
    var sel, range, html;
    this.innerHTML = this.scriptContent.nativeElement.innerHTML;

    //this.scriptValue.replace("\t","");
    //this.scriptContent.nativeElement.innerHTML = this.scriptValue;

    //let scriptValue = this.scriptContent.nativeElement.innerHTML;

    if (window.getSelection) {

      sel = window.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
        range = sel.getRangeAt(0);
        this.range = range;
        //range.deleteContents();
        // range.insertNode( document.createTextNode("\t") );
      }
    }

    // console.log(content, this.range);
    // console.log(this.scriptValue);
    // console.log(this.scriptValue.indexOf("\t"));
  }

  onScriptContentChange(content){
    console.log(content);
  }

  currentTrigger:string;

  insertTrigget(selector){

    if(this.range){

      let action =this.currentTrigger;
      if(action.indexOf('send') !==0) action =' if ('+action+' > 0) {     }';
      else action = 'send_notification ( "Text of notification goes here" )';
      this.range.insertNode( document.createTextNode(action) );
    }else alert('Please click inside script text box');
  }


  setCurrentScript(script:string){


    // console.log(script.indexOf("\n"));


    if(this.scriptContent){
      console.log('setCurrentScript  ' + script);
      script = script.replace(new RegExp("\n","g"),'<br/>');
      // console.log('setCurrentScript  ' + script);
      this.scriptContent.nativeElement.innerHTML = script;
    }
    else setTimeout(()=>this.setCurrentScript(script),2000);
  }
  getCurrentScript():string{
    // console.log(this.scriptContent);
    let text = this.scriptContent.nativeElement.innerText.toString();
    //console.log(text)
    return text;
  }


  setCurrentDog(dog:WatchDog){
    if(dog){
      let script = (dog && dog.sellScript)?dog.sellScript.toString():'';
      this.setCurrentScript(script);
      this.currentDog = dog;
    }else this.currentDog = new WatchDog(new VOWatchdog({}));
    console.log(' set dog ', dog);
  }

  onEditDog(dog){
    console.log(dog);
    this.setCurrentDog(dog);
  }

  closeDog(){
    this.setCurrentDog(null);
  }

  saveDog(){
    if(this.currentDog) {
      let text = this.getCurrentScript();
      if(text && text.length > 50){
        this.currentDog.status = 'full';
       // this.currentDog.scriptIcon = 'fa fa-battery-full';
      }
      else {
        //this.currentDog.scriptIcon ='fa fa-battery-empty';
        //this.currentDog.status = 'empty';
        //this.currentDog.statusIcon = 'fa fa-play';
      }
     // this.currentDog.scriptText = text;
      console.log(text);
      this.emailService.saveData();
      this.snakBar.open(this.currentDog.name+ " Saved!",'',{duration:3000});
    }else this.snakBar.open( "Error no Dog",'Error',{duration:3000});

  }


}
