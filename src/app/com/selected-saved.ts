import {StorageService} from "../services/app-storage.service";

export class SelectedSaved {

  exchange:string;
  storage:StorageService;

  marketsSelected:string[];

  getMarketsSelected():string[]{
    // if(!this.marketsSelected) this.marketsSelected = JSON.parse(this.storage.getItem(this.exchange+'-markets-selected') || '[]');
    return this.marketsSelected;

  }

  saveMarketsSelected(){
    let ar = this.getMarketsSelected();
    this.storage.setItem(this.exchange + '-markets-selected', JSON.stringify(ar))

  }
}
