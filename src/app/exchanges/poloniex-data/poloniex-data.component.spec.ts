import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PoloniexDataComponent } from './poloniex-data.component';

describe('PoloniexDataComponent', () => {
  let component: PoloniexDataComponent;
  let fixture: ComponentFixture<PoloniexDataComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PoloniexDataComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PoloniexDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
