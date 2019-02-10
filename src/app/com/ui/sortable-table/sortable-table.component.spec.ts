import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SortableTableComponent } from './sortable-table.component';

describe('SortableTableComponent', () => {
  let component: SortableTableComponent;
  let fixture: ComponentFixture<SortableTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SortableTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SortableTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
