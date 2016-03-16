
```
npm install genii
```

There is just one function:

```
import { range } from "genii";
```

# Iterator Utilities

The `range` function creates a lazy generator sequence:

```js
import { range } from "genii";

for(let i of range(5)) {
  console.log(i)
}
// 0, 1, 2, 3, 4
```

The `range` iterator is augumented with some useful methods:

```js
let numbers =
  range(100)
    .filter(i => i % 2 == 0)
    .map(i => i * 10)
    .offset(20)
    .limit(5);

for(let i of numbers) {
  console.log(i)
}

// 400
// 420
// 440
// 460
// 480
```

Use the `array` method to collect the iteration result into an array:

```js
range(100)
  .filter(i => i % 2 == 0)
  .map(i => i * 10)
  .offset(20)
  .limit(5)
  .array();
// [ 400, 420, 440, 460, 480 ]
```

Iterating through an array with `range`:

```js
for(let value of range([1,2,3]).map(i => i * 10)) {
  console.log(value);
}

// 10
// 20
// 30
```

Iterating through an object with `range`:

```js
for(let value of range({a: 1, b: 2, c: 3}).map(i => i * 10)) {
  console.log(value);
}
```

# Creating Dictionaries

The `dict` makes it easy to create dictionaries.  To convert an array to a dictionary (using the array index as key):

```js
range([0,1,2]).dict()
// { '0': 0, '1': 1, '2': 2 }
```

We can achieve the same result with a number range:

```js
range(3).dict()
// { '0': 0, '1': 1, '2': 2 }
```

Instead of using the position as key, we can use the `reindex` method to change the keys:

```js
range(3).reindex(val => `key-${val}`).dict()
{ 'key-0': 0, 'key-1': 1, 'key-2': 2 }
```

We also reindex an object:

```
range({a: 1, b: 2, c: 3}).reindex(val => `key-${val}`).dict()
// { 'key-1': 1, 'key-2': 2, 'key-3': 3 }
```

# Indexed Iteration

Under the hood, the genii iterator aguments the [ES6 iteration protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) with the `index` property:

```js
interface Next<K, V> {
  done: boolean;
  value?: V;
  index?: K;
}
```

By doing this, we can treat objects and arrays as interchangeable.

+ Both objects and arrays can be iterated as sequence.
+ We can always convert a sequence to object, using `index` as the key.
+ We can always convert a sequence to an array, collecting `value`.

# API

```js
export function range<T>(dict: { [key: string]: T }): IndexGenerator<string, T>;
export function range<T>(arg: T[]): IndexGenerator<number, T>;
export function range(rangeEnd: number): IndexGenerator<number, number>;
export function range(rangeStart: number, rangeEnd: number): IndexGenerator<number, number>;
export function range(rangeStart: number, rangeEnd: number, step: number): IndexGenerator<number, number>;

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

interface Next<K, V> {
  done: boolean;
  value?: V;
  index?: K;
}

type FilterFunction<K, V> = (value: V, key: K) => boolean;
type MapFunction<K, V, Result> = (value: V, key: K) => Result;
type TapFunction<K, V> = (value: V, key: K) => any;
type IndexFunction<K, V, Result> = (value: V, index: K) => Result;

type NextFunction<K, V> = () => Next<K, V>;
```