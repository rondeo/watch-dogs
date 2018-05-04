import {Subject} from "rxjs/Subject";
import {HttpClient} from "@angular/common/http";

export class HttpDelay {

  Q:string[]
  inProcess:boolean;


  private call(url:string, sub:Subject<any>){
    console.log(Date.now() +' ' + url);
    this.inProcess = true;
    this.http.get(url).subscribe((res:any) => {

      setTimeout(()=>{
        this.inProcess = false;
      }, 500);

      if(res.error){
        console.warn(res.message);

      }else {
        sub.next(res);
      }

    }, err =>{
      console.error(err);
      setTimeout(()=>{
        this.inProcess = false;
      }, 1500);
    })
  }


  private  recall(url:string, sub:Subject<any>){

    if(this.inProcess)  setTimeout(()=>this.recall(url, sub), 500);
    else {
      this.call(url, sub);
    }
  }

  get(url:string){
    const sub = new Subject();

    if(this.inProcess){
      setTimeout(()=>this.recall(url, sub), 1000)
    }else this.call(url, sub);

    return sub;

  }
  constructor(private http:HttpClient){

  }

}
