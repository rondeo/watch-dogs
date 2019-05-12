import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StopLossEditComponent } from './stop-loss-edit.component';

describe('StopLossEditComponent', () => {
  let component: StopLossEditComponent;
  let fixture: ComponentFixture<StopLossEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StopLossEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StopLossEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
