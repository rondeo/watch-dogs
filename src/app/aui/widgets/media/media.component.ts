import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {ApiCryptoCompareService, VOSocialHistObj} from '../../../a-core/apis/api-crypto-compare.service';
import * as  moment from 'moment';
import {VOGraphs} from '../../comps/line-chart/line-chart.component';
import {Utils} from 'tslint';
import {UTILS} from '../../../acom/utils';
import {VOLineGraph} from '../../comps/line-graph/line-graph.component';

@Component({
  selector: 'app-media',
  templateUrl: './media.component.html',
  styleUrls: ['./media.component.css']
})
export class MediaComponent implements OnInit, OnChanges {
  constructor(
   private cryptoCompare: ApiCryptoCompareService
  ) { }

  @Input() coin: string;

  mediaFrom: string;
  mediaTo: string;
  twitterPoints: string;
  twitterFollow: string;
  redditPoints: string;
  redditFollow: string;
  facebookPoints: string;



  myGraps:  VOLineGraph[];

  ngOnInit() {
  }

  ngOnChanges() {
    this.showMedia();
  }



  showMedia() {
    if (!this.coin) return;

    this.cryptoCompare.getSocialHist(this.coin).subscribe(res => {
    //  console.log(res);


      const data: VOSocialHistObj = <VOSocialHistObj>UTILS.arrayToObject(res);

     // console.log(data);

     /* const labelsX = data.time.map(function (item) {
        return moment(+item * 1000).format('DD-MM')
      })*/
      /* res.forEach(function (item) {
         item.time = moment(+item.time * 1000).format('DD-MM HH:mm')
       });
 */


      const graphs = [

        {
          ys: data.followers,
          color: '#969794',
          label: 'followers'
        },
        {
          ys: data.twitter_statuses,
         //  ys: data.comments,
         // ys: data.twitter_followers,
          color: '#ff7f56',
          label: 'tw_stat'
        },
        {
           ys: data.reddit_posts_per_day,
         // ys: data.posts,
         // ys: data.twitter_following,  // good
          color: '#00b922',
          label: 'red_p_day'
        }
        /*  {
            ys:histohour.last,
            color: '#0b8318',
            label: 'last  '
          },
           {
            ys: histohour.volumeto,
            color: '#83193f',
            label: 'V@ '
          }*/

        /* {
            ys: ma.price_1h,
            color: '#0b8318',
            label: 'MA 1h '
          },
          {
            ys:ma.price_2h,
            color: '#133075',
            label: 'MA 2h'
          }*/
      ];

      this.myGraps = graphs
    });



   /* this.cryptoCompare.getSocialStats(this.coin).then(res => {
      if (!res) {
        this.mediaFrom = '';
        this.mediaTo = '';
        this.twitterPoints = '';
        this.redditPoints = '';
        this.facebookPoints = '';
        this.redditFollow = '';
        this.twitterFollow = '';
        return;
      }
      this.mediaFrom = res.timeFrom;
      this.mediaTo = res.timeTo;
      this.twitterPoints = res.TwPoints;
      this.redditPoints = res.RdPoints;
      this.facebookPoints = res.FbPoints;
      this.twitterFollow = res.TwFollow;
      this.redditFollow = res.RdFollow;

    });*/
  }

}
