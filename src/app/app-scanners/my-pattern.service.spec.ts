import { TestBed } from '@angular/core/testing';

import { MyPatternService } from './my-pattern.service';

describe('MyPatternService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MyPatternService = TestBed.get(MyPatternService);
    expect(service).toBeTruthy();
  });
});
