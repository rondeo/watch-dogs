import { async, ComponentFixture, TestBed } from '@angular/a-core/testing';

import { CrossTableComponent } from './cross-table.component';

describe('CrossTableComponent', () => {
  let component: CrossTableComponent;
  let fixture: ComponentFixture<CrossTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CrossTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CrossTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
