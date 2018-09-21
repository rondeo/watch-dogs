import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  Renderer2,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {MatCheckbox} from '@angular/material';

@Directive({
  selector: '[appSaveValue]'
})
export class SaveValueDirective implements AfterViewInit {

  @ViewChild(MatCheckbox) inputComponent: MatCheckbox;

  constructor(
    private el: ElementRef
  ) {

    //   el.nativeElement.checked = true;
    // el.nativeElement.constructor.checked = true
    //  console.warn(el.nativeElement.constructor.checked);
    //el.nativeElement.toggle();
    //  console.log(el.nativeElement.checked)
  }


  @HostListener('change', ['$event']) onChange(evt) {
    console.log(evt.checked);
  }


  ngAfterViewInit() {
    console.log(this.el.nativeElement.checked);
    // available here
  }


}
