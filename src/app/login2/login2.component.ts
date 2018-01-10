import { Component, OnInit } from '@angular/core';

import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-login2',
  templateUrl: './login2.component.html',
  styleUrls: ['./login2.component.css']
})
export class Login2Component implements OnInit {

  mypassword:string;
  email:string;
  isRemote:boolean = true;


  constructor(
   // private allWalletsService:WalletsAllService,
    private router:Router,
    private route:ActivatedRoute
  ) { }

  ngOnInit() {
    let path = this.route.snapshot.url[0].path;
   /* if(path === 'logout') {
      this.allWalletsService.logout();
      this.router.navigate(['/my-wallets']);
    }*/
  }

  login(){

   /* if(this.mypassword)this.allWalletsService.login(this.email, this.mypassword, this.isRemote);
    console.log(this.mypassword);
*/
    this.router.navigate(['/my-wallets']);
  }

}
