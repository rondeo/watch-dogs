import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { YoBitMarketComponent } from './yo-bit-market.component';

describe('YoBitMarketComponent', () => {
  let component: YoBitMarketComponent;
  let fixture: ComponentFixture<YoBitMarketComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ YoBitMarketComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(YoBitMarketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
