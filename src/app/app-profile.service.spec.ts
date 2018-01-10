import { TestBed, inject } from '@angular/core/testing';

import { AppProfileService } from './app-profile.service';

describe('AppProfileService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppProfileService]
    });
  });

  it('should be created', inject([AppProfileService], (service: AppProfileService) => {
    expect(service).toBeTruthy();
  }));
});
