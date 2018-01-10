import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NovaexchangeComponent } from './novaexchange.component';

describe('NovaexchangeComponent', () => {
  let component: NovaexchangeComponent;
  let fixture: ComponentFixture<NovaexchangeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NovaexchangeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NovaexchangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
