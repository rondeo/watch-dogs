import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FollowMarketComponent } from './follow-market.component';

describe('FollowMarketComponent', () => {
  let component: FollowMarketComponent;
  let fixture: ComponentFixture<FollowMarketComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FollowMarketComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FollowMarketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
