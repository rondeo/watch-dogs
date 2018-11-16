import { Component, OnInit } from '@angular/core';
import {StorageService} from '../../services/app-storage.service';
import {NotesHistoryComponent} from '../notes-history/notes-history.component';
import {FollowOrdersService} from '../../apis/open-orders/follow-orders.service';

@Component({
  selector: 'app-order-reports',
  templateUrl: './order-reports.component.html',
  styleUrls: ['./order-reports.component.css']
})
export class OrderReportsComponent implements OnInit {

  ordersRecords:any[];
  ordersData: any[];
  selectedKey: string;
  constructor(
    private storage:StorageService,
    private followOrder: FollowOrdersService
  ) { }

  ngOnInit() {
    this.initAsync();
  }
  async initAsync(){

    setTimeout(() => this.populateBots(), 5000);
   /*
    const keys:string[] = await this.storage.keys();

    // console.log(keys);
    const orders = keys.filter(function (item) {
      return item.indexOf('order') !==-1
    })
    this.ordersRecords = orders.map(function (item) {
      return {
        key:item,
        x:'X'
      }
    });*/

  }


 //////////////////////////////////////BOTS


  /*onBotsChange(evt) {
    if(evt.checked) this.populateBots();
    else this.bots = null;
  }
*/
  populateBots() {
    this.followOrder.getBots().then(res=>{
      if(!res) return;
      this.ordersRecords = res.map(function (item) {
        return{
          market: item.market,
          x:'X'
        }
      })
    })

  }

  onRecordsClick(evt) {
    const market = evt.item.market;
    switch (evt.prop) {
      case 'market':
        this.showBotHistory(market);
        return;
      case 'x':
        if (confirm(' DELETE ' + market)) {
          this.followOrder.deleteBot(market)
            .then(this.populateBots.bind(this))
        }
        return;

    }
  }

  market: string;
  async showBotHistory(market: string){
    this.market = market;

    this.ordersData = ((await this.storage.select('bot-'+market)) || []).map(function (item) {
      return {
        record:item
      }
    });
  }




  ///////////////////////////////////////////////////
  onDeleteRecordsClick(){
    if(confirm('Delete  history ' + this.market + '?')) {
      this.storage.remove('bot-'+this.market).then(()=>{

      })
    }
  }

  onOrdersDataClick(evt){
    console.log(evt);
  }

  onOrdersRecordsClick(evt){
    console.log(evt)
    switch (evt.prop) {
      case 'key':
        this.selectedKey = evt.item.key;
        this.storage.select(this.selectedKey).then(results =>{
        //  console.log(results);

         if(Array.isArray(results))
          this.ordersData = results.map(function (item) {
            return {
              record:item,
            }
          });
         else this.ordersData = [results]
        });

        return
    }

  }

}
