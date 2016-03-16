interface Next<K, V> {
  done: boolean;
  value?: V;
  index?: K;
}

type TapFunction<K, V> = (value: V, key: K) => any;
type NextFunction<K, V> = () => Next<K, V>;

type IndexFunction<K, V, Result> = (value: V, index: K) => Result;

interface IndexGenerator<K, V> {
  // Next item.
  next(): Next<K, V>;

  // Filter the sequence.
  filter(fn: FilterFunction<K, V>): IndexGenerator<K, V>;

  // Transform the sequence.
  map<Result>(fn: MapFunction<K, V, Result>): IndexGenerator<K, Result>;

  // Transform the index of the sequence.
  reindex<Result>(fn: IndexFunction<K, V, Result>): IndexGenerator<Result, V>;

  // Restrict the length of the sequence.
  limit(size: number): IndexGenerator<K, V>;

  // Shift the sequence.
  offset(offset: number): IndexGenerator<K, V>;

  // Allow side-effect while iterating through the sequence.
  tap(f: TapFunction<K, V>): IndexGenerator<K, V>;

  // collect sequence values into array
  array(): V[];

  // collect sequence key/values into dictionary
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
    for (let value of this) {
      acc.push(value);
    }

    return acc;
  }

  dict(): { [key: string]: V } {
    let acc: { [key: string]: V } = {};

    while (true) {
      const { value, index, done } = this.next();
      if (done) {
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
      if (done) {
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

  limit(size: number): IndexGenerator<K, V> {
    const gen = this;
    let i = 0;

    function next(): Next<K, V> {
      if (i >= size) {
        return { done: true }
      }

      const result = gen.next();

      if (result.done) {
        return result;
      }

      i++;

      return result;
    }

    return new BaseIterator(next);
  }

  offset(offset: number): IndexGenerator<K, V> {
    const gen = this;
    let i = 0;

    function next(): Next<K, V> {
      if (i < offset) {
        while (true) {
          const result = gen.next();

          if (result.done) {
            return result;
          }

          i++;

          if (i >= offset) {
            break;
          }
        }
      }

      return gen.next();
    }


    return new BaseIterator(next);
  }

  tap(f: TapFunction<K, V>): IndexGenerator<K, V> {
    const gen = this;
    function next(): Next<K, V> {
      const result = gen.next();
      if (result.done) {
        return result;
      }

      const { index, value } = result;
      f(value, index);
      return result;
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

// Imitate Python's range contract
function numberRange(start: number, end: number, step: number) {
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

  const next = step > 0 ? inc : dec;

  return new BaseIterator(next);
}


export function range<T>(dict: { [key: string]: T }): IndexGenerator<string, T>;
export function range<T>(arg: T[]): IndexGenerator<number, T>;
export function range(rangeEnd: number): IndexGenerator<number, number>;
export function range(rangeStart: number, rangeEnd: number): IndexGenerator<number, number>;
export function range(rangeStart: number, rangeEnd: number, step: number): IndexGenerator<number, number>;
export function range(arg: any, ...rest: any[]): any {
  if (arg instanceof Array) {
    return arrayGenerator(arg);
  }

  if (typeof arg === "number") {

    let start: number = arg;
    let end: number = arguments[1];
    let step: number = arguments[2] || 1;

    // 1 argument case
    if (end === undefined) {
      end = arg;
      start = 0;
    }

    if (step === 0) {
      throw new Error(`range step cannot be zero: range(${start}, ${end}, ${end})`);
    }

    return numberRange(start, end, step);
  }

  // default to iterating through object properties
  return dictionaryGenerator(arg);
}