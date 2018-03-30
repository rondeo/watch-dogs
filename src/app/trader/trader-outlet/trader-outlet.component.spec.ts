import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TraderOutletComponent } from './trader-outlet.component';

describe('TraderOutletComponent', () => {
  let component: TraderOutletComponent;
  let fixture: ComponentFixture<TraderOutletComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TraderOutletComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TraderOutletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
