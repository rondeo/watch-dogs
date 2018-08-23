import {Directive, ElementRef, Input, OnChanges, OnInit} from '@angular/core';

@Directive({
  selector: '[appValueColor]'
})
export class ValueColorDirective implements OnChanges{
  @Input() appValueColor: number;
  color = 'green';
  constructor(
    private el: ElementRef
  ) {
    el.nativeElement.classList.add('green');
  }
  ngOnChanges(){

    if(!isNaN(+this.appValueColor))this.el.nativeElement.innerText  = Number(this.appValueColor);
    if(this.appValueColor) {

      if(this.appValueColor < 0 && this.color === 'green') {
        this.el.nativeElement.classList.remove('green');
        this.el.nativeElement.classList.add('red');
        this.color = 'red';
      }else if(this.color === 'red') {
        this.color = 'green';
        this.el.nativeElement.classList.remove('red');
        this.el.nativeElement.classList.add('green');
      }
    }
  }

}
