import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {ApiCryptoCompareService} from '../../apis/api-crypto-compare.service';

@Component({
  selector: 'app-media',
  templateUrl: './media.component.html',
  styleUrls: ['./media.component.css']
})
export class MediaComponent implements OnInit, OnChanges {

  @Input() coin: string;
  constructor(
   private cryptoCompare: ApiCryptoCompareService
  ) { }

  ngOnInit() {
  }

  ngOnChanges(){
    this.showMedia();
  }

  mediaFrom: string;
  mediaTo: string;
  twitterPoints: string;
  twitterFollow: string;
  redditPoints: string;
  redditFollow: string;
  facebookPoints: string;



  showMedia() {
    if(!this.coin) return;
    this.cryptoCompare.getSocialStats(this.coin).then(res => {
      if(!res){
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

    })
  }

}
