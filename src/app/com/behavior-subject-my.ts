import {Subject} from 'rxjs/Subject';
import {ISubscription, Subscription} from 'rxjs/Subscription';
import {Subscriber} from 'rxjs/Subscriber';
import {ObjectUnsubscribedError} from 'rxjs/util/ObjectUnsubscribedError';
import {reject} from 'q';
import {HttpClient} from '@angular/common/http';


export class BehaviorSubjectMy<T> extends Subject<T> {
  private _value: T;

  constructor() {
    super();
  }

  get value(): T {
    return this.getValue();
  }

  /** @deprecated internal use only */ _subscribe(subscriber: Subscriber<T>): Subscription {
    const subscription = super._subscribe(subscriber);
    if (subscription && !(<ISubscription>subscription).closed && this._value) {
      subscriber.next(this._value);
    }
    return subscription;
  }

  getValue(): T {
    if (this.hasError) {
      throw this.thrownError;
    } else if (this.closed) {
      throw new ObjectUnsubscribedError();
    } else {
      return this._value;
    }
  }

  next(value: T): void {
    super.next(this._value = value);
  }
}
