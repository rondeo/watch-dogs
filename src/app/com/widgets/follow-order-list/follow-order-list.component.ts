import {Component, OnInit} from '@angular/core';
import {FollowOrdersService} from '../../../core/apis/open-orders/follow-orders.service';
import {FollowOpenOrder} from '../../../core/apis/open-orders/follow-open-order';

@Component({
  selector: 'app-follow-order-list',
  templateUrl: './follow-order-list.component.html',
  styleUrls: ['./follow-order-list.component.css']
})
export class FollowOrderListComponent implements OnInit {

  follows: FollowOpenOrder[];

  constructor(
    private openOrders: FollowOrdersService
  ) {
  }

  ngOnInit() {
    this.openOrders.followingOrdersSub.subscribe(following => {
      this.follows = following;
    });
  }

}
