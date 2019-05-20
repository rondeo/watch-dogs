import {
  ActionReducer,
  ActionReducerMap,
  createFeatureSelector,
  createSelector,
  MetaReducer
} from '@ngrx/store';
import { environment } from '../../../environments/environment';
import {BotsReducer, BotsState} from '../../app-bots/reducers/app-bots.reducer';


export interface AppState {
      bots: BotsState
}

export const reducers: ActionReducerMap<AppState> = {
        bots: BotsReducer
};


export const metaReducers: MetaReducer<AppState>[] = !environment.production ? [] : [];
