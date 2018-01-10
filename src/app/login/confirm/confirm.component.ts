import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {setTimeout} from 'timers';
import {MatSnackBar} from '@angular/material';
import {HttpClient} from "@angular/common/http";

@Component({
  selector: 'app-confirm',
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.css']
})
export class ConfirmComponent implements OnInit {

  message:string;

  constructor(
    private route:ActivatedRoute,
    private router:Router,
    private http:HttpClient,
    private snackBar:MatSnackBar
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      let session = params.session;
      console.log(session);
      let url = '/api/login/confirm/'+session;
      this.http.get(url).subscribe((res:any)=>{
        if(res.success){
          setTimeout(()=>{
            this.router.navigateByUrl('/login/login');
          }, 5000);
        }

        this.snackBar.open(res.message, 'x');
      })


    });
  }

}
