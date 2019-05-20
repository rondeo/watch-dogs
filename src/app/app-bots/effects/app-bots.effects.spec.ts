import { TestBed, inject } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs';

import { AppBotsEffects } from './app-bots.effects';

describe('AppBotsEffects', () => {
  let actions$: Observable<any>;
  let effects: AppBotsEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AppBotsEffects,
        provideMockActions(() => actions$)
      ]
    });

    effects = TestBed.get(AppBotsEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
