import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PoloniexTickerComponent } from './poloniex-ticker.component';

describe('PoloniexTickerComponent', () => {
  let component: PoloniexTickerComponent;
  let fixture: ComponentFixture<PoloniexTickerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PoloniexTickerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PoloniexTickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
