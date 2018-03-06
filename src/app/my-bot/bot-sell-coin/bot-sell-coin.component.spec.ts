import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BotSellCoinComponent } from './bot-sell-coin.component';

describe('BotSellCoinComponent', () => {
  let component: BotSellCoinComponent;
  let fixture: ComponentFixture<BotSellCoinComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BotSellCoinComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BotSellCoinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
