import {Component, OnInit} from '@angular/core';
import {StorageService} from '../../services/app-storage.service';
import {NotesHistoryComponent} from '../notes-history/notes-history.component';
import {FollowOrdersService} from '../../apis/open-orders/follow-orders.service';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';
import * as  moment from 'moment';

@Component({
  selector: 'app-order-reports',
  templateUrl: './order-reports.component.html',
  styleUrls: ['./order-reports.component.css']
})
export class OrderReportsComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storage: StorageService,
    private followOrder: FollowOrdersService
  ) {
  }

  ordersRecords: any[];
  ordersData: any[];
  selectedKey: string;

  market: string;
  dataName = '-logs';

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.market = params.market;
      this.showBotHistory();
    });
  }


  onDeleteUSDTRecordsClick(){
    if(confirm('DELETE USDT_BTC ?')){
      this.storage.remove('USDT_BTC-alerts').then(()=>{
        this.onUsdtBtcClick();
      })
    }
  }
  async onUsdtBtcClick() {
    this.ordersData = await this.storage.select('USDT_BTC-alerts');
  }

  onBotsClick(){
    this.populateBots();

  }

  onOrdersClick(){

  }
  ////////////////////////////////////// BOTS


  /*onBotsChange(evt) {
    if(evt.checked) this.populateBots();
    else this.bots = null;
  }
*/

  populateBots() {
    this.followOrder.getBots().then(res => {
      if (!res) return;
      this.ordersRecords = res.map(function (item) {
        return {
          market: item.market,
          x: 'X'
        };
      });
    });
  }

  onRecordsClick(evt) {
    const market = evt.item.market;
    switch (evt.prop) {
      case 'market':
        this.router.navigate(['trader/order-reports', {market}]);
        return;
      case 'x':
        if (confirm(' DELETE ' + market)) {
          this.followOrder.deleteBot(market)
            .then(this.populateBots.bind(this));
        }
        return;
    }
  }

  async showBotHistory() {
    if (!this.market) {
      this.ordersData = null;
      return;
    }
    const id = 'bot-' + this.market + this.dataName;
     console.log(id);
    switch (this.dataName) {
      case '-patterns':
        this.ordersData = ((await this.storage.select(id)) || []).map(function (item) {
          return {
            date: moment(item.stamp).format('DD HH:mm'),
            state: item.state,
            v3_med: item.v3_med,
            VD: item.VD,
            ma3_25: item.ma3_25,
            PD: item.PD
          }
        });
        break;
      default:
        this.ordersData = ((await this.storage.select(id)) || []);
        break;
    }
  }

  onDataChange(evt) {
    this.dataName = evt.value;
    this.showBotHistory();
  }

  ///////////////////////////////////////////////////
  async onDeleteRecordsClick() {
    const bots = await this.followOrder.getBots();
    const exist = _.find(bots, {market: this.market});
    if (!exist) return;
    if (confirm('Delete  history ' + this.market + '?')) {
      await exist.deleteHistory();
      this.showBotHistory();
    }
  }

  onOrdersDataClick(evt) {
    console.log(evt);
  }

  /* onOrdersRecordsClick(evt){
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

   }*/

}
