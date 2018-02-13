import {Observable} from "rxjs/Observable";
import {applyMixins, VOOrder} from "../../my-models";
import {HttpConnector} from "./http-connector";
import {SoketConnector} from "./soket-connector";

import {HttpClient} from "@angular/common/http";
import {Channels, IChannel} from "../socket-models";

export class ApiBitfinex extends HttpConnector{

  constructor(http:HttpClient){
    super(http);
  }


}

//applyMixins (ApiBitfinex, [HttpConnector, SoketConnector]);