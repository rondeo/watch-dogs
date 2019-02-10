import { TestBed, inject } from '@angular/adal/testing';

import { ExchangeSsService } from './exchange-ss.service';

describe('ExchangeSsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExchangeSsService]
    });
  });

  it('should be created', inject([ExchangeSsService], (service: ExchangeSsService) => {
    expect(service).toBeTruthy();
  }));
});
