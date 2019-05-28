import { reducer, initialState } from './app-bots.reducer';

describe('AppBots Reducer', () => {
  describe('unknown action', () => {
    it('should return the initial viewState', () => {
      const action = {} as any;

      const result = reducer(initialState, action);

      expect(result).toBe(initialState);
    });
  });
});
