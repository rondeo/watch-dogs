import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-table-props',
  templateUrl: './table-props.component.html',
  styleUrls: ['./table-props.component.css']
})
export class TablePropsComponent implements OnInit, OnChanges {

  @Input() dataset: any[];

  @Output() selected: EventEmitter<{item:any, prop: string}> = new EventEmitter<{item: any, prop: string}>();

  objectKeys = Object.keys;
  objectValues = Object.values;
  constructor() { }

  ngOnInit() {
  }

  ngOnChanges(){

  }

  onValueClick(i:number, j:number){
    const item = this.dataset[i];
    const prop = Object.keys(item)[j];
    this.selected.emit({item, prop})

  }

}
