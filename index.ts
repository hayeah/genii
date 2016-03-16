// TODO: tap, take,

class ObjectGenerator {

}

interface Next<K, V> {
  done: boolean;
  value?: V;
  index?: K;
}

type NextFunction<K, V> = () => Next<K, V>;

type IndexFunction<K, V, Result> = (value: V, index: K) => Result;

interface IndexGenerator<K, V> {
  next(): Next<K, V>;
  filter(fn: FilterFunction<K, V>): IndexGenerator<K, V>;
  map<Result>(fn: MapFunction<K, V, Result>): IndexGenerator<K, Result>;

  reindex<Result>(fn: IndexFunction<K, V, Result>): IndexGenerator<Result, V>

  // collect values into array
  array(): V[];
  // collect key/values into dictionary
  dict(): { [key: string]: V }

  [Symbol.iterator]: () => {
    next: NextFunction<K, V>;
  };
}

class BaseIterator<K, V> implements IndexGenerator<K, V> {
  constructor(public _next: NextFunction<K, V>) {
  }

  filter(fn: FilterFunction<K, V>) {
    return filter(this, fn);
  }

  map<Result>(fn: MapFunction<K, V, Result>) {
    return map(this, fn);
  }

  array(): V[] {
    let acc: V[] = [];
    for(let value of this) {
      acc.push(value);
    }

    return acc;
  }

  dict(): { [key: string]: V } {
    let acc: { [key: string]: V } = {};

    while(true) {
      const { value, index, done } = this.next();
      if(done) {
        break;
      }

      acc[index.toString()] = value;
    }

    return acc;
  }

  /**
   * Transforms the index of the generator sequence.
   */
  reindex<Result>(fn: IndexFunction<K, V, Result>): IndexGenerator<Result, V> {
    const self = this;

    function next(): Next<Result, V> {
      const { index, value, done } = self.next();
      if(done) {
        return { done };
      }

      const newIndex = fn(value, index);
      return {
        index: newIndex,
        value,
        done: false
      };
    }

    return new BaseIterator(next);
  }

  next() {
    return this._next();
  }

  [Symbol.iterator]() {
    return { next: this._next }
  }
}


type MapFunction<K, V, Result> = (value: V, key: K) => Result;

function map<K, V, R>(gen: IndexGenerator<K, V>, fn: MapFunction<K, V, R>): IndexGenerator<K, R> {
  function next(): Next<K, R> {
    while (true) {
      const next = gen.next();

      if (next.done) {
        return { done: true };
      }

      const { value, index } = next;

      return {
        index,
        value: fn(value, index),
        done: false,
      };
    }
  }

  return new BaseIterator(next);
}


type FilterFunction<K, V> = (value: V, key: K) => boolean;

function filter<K, V>(gen: IndexGenerator<K, V>, filter: FilterFunction<K, V>): IndexGenerator<K, V> {
  function next(): Next<K, V> {
    while (true) {
      const next = gen.next();

      if (next.done) {
        return { done: true };
      }

      const { value, index } = next;

      if (filter(value, index)) {
        return { value, index, done: false }
      }
    }
  }

  return new BaseIterator(next);
}

function dictionaryGenerator<T>(obj: { [key: string]: T }): IndexGenerator<string, T> {
  let keys: string[];
  let i = 0;
  function next(): Next<string, T> {
    if (keys === undefined) {
      keys = Object.keys(obj);
    }

    if (i >= keys.length) {
      return { done: true };
    }

    const index = keys[i];
    const value = obj[index];
    i++;

    return {
      value,
      index,
      done: false,
    }
  }

  return new BaseIterator(next);
}

function arrayGenerator<T>(array: T[]): IndexGenerator<number, T> {
  let i = 0;
  function next(): Next<number, T> {
    if (i >= array.length) {
      return { done: true };
    }

    const next = {
      value: array[i],
      index: i,
      done: false
    };

    i++;

    return next;
  }

  return new BaseIterator(next);
}

function numberRange(start: number, end: number, step: number = 1) {
  let i = 0;
  let cur = start;

  function inc(): Next<number, number> {
    if (cur >= end) {
      return { done: true };
    }

    const next = {
      index: i,
      value: cur,
      done: false,
    }

    cur += step;
    i++;

    return next;
  }

  function dec(): Next<number, number> {
    if (cur <= end) {
      return { done: true };
    }

    const next = {
      index: i,
      value: cur,
      done: false
    }

    cur += step;
    i++;

    return next;
  }

  const next = end > start ? inc : dec;

  return new BaseIterator(next);
}


export function range<T>(dict: { [key: string]: T }): IndexGenerator<string, T>;
export function range<T>(arg: T[]): IndexGenerator<number, T>;
export function range(rangeEnd: number): IndexGenerator<number, number>;
export function range(arg: any, ...rest: any[]): any {
  if (arg instanceof Array) {
    return arrayGenerator(arg);
  }

  if (typeof arg === "number") {
    // 1 argument
    let start: number;
    let end: number;
    let step: number;
    if (arg > 0) {
      start = 0;
      end = arg;
      step = 1;
    } else {
      start = 0;
      end = arg;
      step = -1;
    }

    // todo: 2 arguments

    return numberRange(0, end, step);
  }

  // default to iterating through object properties
  return dictionaryGenerator(arg);
}