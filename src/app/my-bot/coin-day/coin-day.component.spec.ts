import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoinDayComponent } from './coin-day.component';

describe('CoinDayComponent', () => {
  let component: CoinDayComponent;
  let fixture: ComponentFixture<CoinDayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CoinDayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CoinDayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
