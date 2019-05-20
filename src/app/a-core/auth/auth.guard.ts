import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';

import {isLoggedIn} from './auth.selectors';
import {tap} from 'rxjs/operators';
import {of} from 'rxjs/internal/observable/of';

@Injectable()
export class AuthGuard implements CanActivate {


  constructor(
    //private store: Store<AppState>,
              private router: Router
  ) {

  }


  canActivate(route: ActivatedRouteSnapshot,
              state: RouterStateSnapshot): Observable<boolean>  {

    return of(true);

  }

}
