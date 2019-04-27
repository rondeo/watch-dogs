import { async, ComponentFixture, TestBed } from '@angular/a-core/testing';

import { BtcTetherComponent } from './btc-tether.component';

describe('BtcTetherComponent', () => {
  let component: BtcTetherComponent;
  let fixture: ComponentFixture<BtcTetherComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BtcTetherComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BtcTetherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
