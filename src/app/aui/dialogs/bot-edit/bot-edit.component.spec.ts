import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BotEditComponent } from './bot-edit.component';

describe('BotEditComponent', () => {
  let component: BotEditComponent;
  let fixture: ComponentFixture<BotEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BotEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BotEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
