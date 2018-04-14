import { Component, OnInit } from '@angular/core';
import {ApiAllPublicService} from "../../apis/api-all-public.service";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-trader-recording',
  templateUrl: './trader-recording.component.html',
  styleUrls: ['./trader-recording.component.css']
})
export class TraderRecordingComponent implements OnInit {

  market: string;
  constructor(private apis:ApiAllPublicService, private route: ActivatedRoute ) {

  }

  ngOnInit() {
    this.route.params.subscribe(params =>{
      this.market = params.market;
    });
  }

  startRecording(){

  }

}
