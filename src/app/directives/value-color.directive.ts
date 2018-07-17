import {Directive, ElementRef, Input, OnChanges, OnInit} from '@angular/core';

@Directive({
  selector: '[appValueColor]'
})
export class ValueColorDirective implements OnChanges{
  @Input() appValueColor: number;
  constructor(
    private el: ElementRef
  ) {

  }
  ngOnChanges(){
    if(this.appValueColor) this.el.nativeElement.classList.add(this.appValueColor < 0?'dred':'dgreen');
  }

}
