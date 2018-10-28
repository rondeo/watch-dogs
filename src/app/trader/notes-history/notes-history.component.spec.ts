import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NotesHistoryComponent } from './notes-history.component';

describe('NotesHistoryComponent', () => {
  let component: NotesHistoryComponent;
  let fixture: ComponentFixture<NotesHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NotesHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotesHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
