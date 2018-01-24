import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-refresh-button',
  templateUrl: './refresh-button.component.html',
  styleUrls: ['./refresh-button.component.css']
})
export class RefreshButtonComponent implements OnInit, OnChanges {

  @Output() onRefresh:EventEmitter<number> = new EventEmitter();
  @Input() durationMin2:number = 0;
  constructor() { }


  ngOnChanges(change){
    if(change.durationMin2){
      this.isHistoryLoading = false;
    }
  }

  ngOnInit() {
  }

  isHistoryLoading:boolean;
  refreshMarketHistory(){

    console.log('emitting ')
    this.onRefresh.emit(Date.now());
    this.isHistoryLoading = true;
  }

  onAutoClick(evt){
    //console.log(evt);
    this.isAuto = evt.checked;
    if(this.isAuto) this.startAutoRefresh();
    else this.stopAutoRefresh();
  }

  timeoutAutoRefresh;
  isAuto;
  intervalCount;
  refreshCount:number;

  stopAutoRefresh(){
    this.refreshCount = 0;
    clearTimeout(this.timeoutAutoRefresh);
    clearInterval(this.intervalCount);
  }

  startAutoRefresh(){
    if(!this.durationMin2) {
      console.warn('durationD required ');
      return
    }
    if(this.isAuto){

      this.setRefreshCount();
      this.intervalCount = setInterval(()=>{
        this.refreshCount--;

      }, 1000);

      this.refreshMarketHistory();
    }
  }

  private setRefreshCount(){
    let min = this.durationMin2/2;
    if(min < 0.5) min = 0.5;
    let sec = (min * 60);
    this.refreshCount = Math.round(sec);
  }


}
