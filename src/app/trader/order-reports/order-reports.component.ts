import { Component, OnInit } from '@angular/core';
import {StorageService} from '../../services/app-storage.service';

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
    private storage:StorageService
  ) { }

  ngOnInit() {
    this.initAsync();
  }
  async initAsync(){
    const keys:string[] = await this.storage.keys()
    // console.log(keys);
    const orders = keys.filter(function (item) {
      return item.indexOf('order') !==-1
    })
    this.ordersRecords = orders.map(function (item) {
      return {
        key:item,
        x:'X'
      }
    });

  }


  onDeleteRecordsClick(){
    if(confirm('Delete ' + this.selectedKey + '?')) {
      this.storage.remove(this.selectedKey).then(()=>{
        this.initAsync();
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
