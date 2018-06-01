import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BotFollowCoinComponent } from './bot-follow-coin.component';

describe('BotFollowCoinComponent', () => {
  let component: BotFollowCoinComponent;
  let fixture: ComponentFixture<BotFollowCoinComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BotFollowCoinComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BotFollowCoinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
