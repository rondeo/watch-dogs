
import {reject} from 'q';
import {HttpClient} from '@angular/common/http';
import {Subject, Subscriber, Subscription} from 'rxjs';


class ISubscription {
}

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
    if (subscription &&  this._value) {
      subscriber.next(this._value);
    }
    return subscription;
  }

  getValue(): T {
    if (this.hasError) {
      throw this.thrownError;
    } else if (this.closed) {
      throw new Error('subscriber');
    } else {
      return this._value;
    }
  }

  next(value: T): void {
    super.next(this._value = value);
  }
}
