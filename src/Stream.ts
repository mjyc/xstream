import {Observer} from './Observer';
import {Producer} from './Producer';
import {MapProducer} from './operator/MapProducer';
import {FilterProducer} from './operator/FilterProducer';
import {TakeProducer} from './operator/TakeProducer';
import {SkipProducer} from './operator/SkipProducer';
import {DebugProducer} from './operator/DebugProducer';
import {FoldProducer} from './operator/FoldProducer';
import {LastProducer} from './operator/LastProducer';

export class Stream<T> implements Observer<T> {
  public observers: Array<Observer<T>>;
  public num: number; // Number of non-operator subscribers

  constructor(public machine: Producer<T>) {
    this.observers = [];
    this.num = 0;
  }

  next(x: T): void {
    const len = this.observers.length;
    if (len === 1) {
      this.observers[0].next(x);
    } else {
      for (let i = 0; i < len; i++) {
        this.observers[i].next(x);
      }
    }
  }

  error(err: any): void {
    const len = this.observers.length;
    if (len === 1) {
      this.observers[0].error(err);
    } else {
      for (let i = 0; i < len; i++) {
        this.observers[i].error(err);
      }
    }
  }

  complete(): void {
    const len = this.observers.length;
    if (len === 1) {
      this.observers[0].complete();
    } else {
      for (let i = 0; i < len; i++) {
        this.observers[i].complete();
      }
    }
  }

  subscribe(observer: Observer<T>): void {
    this.observers.push(observer);
    if (++this.num === 1) this.machine.start(this);
  }

  unsubscribe(observer: Observer<T>): void {
    const i = this.observers.indexOf(observer);
    if (i > -1) {
      this.observers.splice(i, 1);
      if (--this.num <= 0) this.machine.stop();
    }
  }

  map<U>(project: (t: T) => U): Stream<U> {
    return new Stream<U>(new MapProducer(project, this));
  }

  filter(predicate: (t: T) => boolean): Stream<T> {
    return new Stream<T>(new FilterProducer(predicate, this));
  }

  take(amount: number): Stream<T> {
    return new Stream<T>(new TakeProducer(amount, this));
  }

  skip(amount: number): Stream<T> {
    return new Stream<T>(new SkipProducer(amount, this));
  }

  debug(spy: (t: T) => void = null): Stream<T> {
    return new Stream<T>(new DebugProducer(spy, this));
  }

  fold<R>(accumulate: (acc: R, t: T) => R, init: R): Stream<R> {
    return new Stream<R>(new FoldProducer(accumulate, init, this));
  }

  last(): Stream<T> {
    return new Stream<T>(new LastProducer(this));
  }
}
