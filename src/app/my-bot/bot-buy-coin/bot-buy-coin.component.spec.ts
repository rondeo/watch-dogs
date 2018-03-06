import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BotBuyCoinComponent } from './bot-buy-coin.component';

describe('BotBuyCoinComponent', () => {
  let component: BotBuyCoinComponent;
  let fixture: ComponentFixture<BotBuyCoinComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BotBuyCoinComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BotBuyCoinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
