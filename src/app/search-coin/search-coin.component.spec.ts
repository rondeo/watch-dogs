import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchCoinComponent } from './search-coin.component';

describe('SearchCoinComponent', () => {
  let component: SearchCoinComponent;
  let fixture: ComponentFixture<SearchCoinComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SearchCoinComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchCoinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
