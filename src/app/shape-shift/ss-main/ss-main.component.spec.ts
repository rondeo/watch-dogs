import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SsMainComponent } from './ss-main.component';

describe('SsMainComponent', () => {
  let component: SsMainComponent;
  let fixture: ComponentFixture<SsMainComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SsMainComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SsMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
