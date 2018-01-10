import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketCapMainComponent } from './market-cap-main.component';

describe('MarketCapMainComponent', () => {
  let component: MarketCapMainComponent;
  let fixture: ComponentFixture<MarketCapMainComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MarketCapMainComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MarketCapMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
