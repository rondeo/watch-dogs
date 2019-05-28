import { authReducer, initialAuthState } from './auth.reducer';

describe('Auth Reducer', () => {
  describe('unknown orderType', () => {
    it('should return the initial viewState', () => {
      const action = {} as any;

      const result = authReducer(initialAuthState, action);

      expect(result).toBe(initialAuthState);
    });
  });
});
