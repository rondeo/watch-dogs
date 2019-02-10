import {Directive, ElementRef, Input, OnChanges, OnInit} from '@angular/core';

@Directive({
  selector: '[myValueColor]'
})
export class ValueColorDirective implements OnChanges{
  @Input() myValueColor: number;
  color = 'green';
  constructor(
    private el: ElementRef
  ) {
    el.nativeElement.classList.add('green');
  }
  ngOnChanges(){

    if(!isNaN(+this.myValueColor))this.el.nativeElement.innerText  = Number(this.myValueColor);
    if(this.myValueColor) {

      if(this.myValueColor < 0 && this.color === 'green') {
        this.el.nativeElement.classList.remove('green');
        this.el.nativeElement.classList.add('red');
        this.color = 'red';
      }else if(this.color === 'red' && this.myValueColor > 0) {
        this.color = 'green';
        this.el.nativeElement.classList.remove('red');
        this.el.nativeElement.classList.add('green');
      }
    }
  }

}
