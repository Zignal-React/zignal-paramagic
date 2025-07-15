# @zignal/paramagic

[![npm version](https://img.shields.io/npm/v/@zignal/paramagic.svg)](https://www.npmjs.com/package/@zignal/paramagic)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@zignal/paramagic)](https://bundlephobia.com/result?p=@zignal/paramagic)
[![npm downloads](https://img.shields.io/npm/dm/@zignal/paramagic.svg)](https://www.npmjs.com/package/@zignal/paramagic)

Paramagic plugin for [@zignal/core](https://github.com/Zignal-React/zignal-core) signal stores. Syncs your state to and from the URL query string for shareable, bookmarkable, and reload-persistent state.

## Install

```sh
npm install @zignal/core @zignal/paramagic
# or
yarn add @zignal/core @zignal/paramagic
# or
pnpm add @zignal/core @zignal/paramagic
```

> You must also install [`@zignal/core`](https://github.com/Zignal-React/zignal-core).

## Usage

### Basic Example

```tsx
import { createZignal } from '@zignal/core';
import { buildQueryString } from '@zignal/paramagic';

const useCounter = createZignal(0);
const useCounterWithUrl = buildQueryString(useCounter, { key: 'counter' });

function Counter() {
  const [count, setCount] = useCounterWithUrl();
  // The count is now synced with the URL query string!
}
```

### Multi-key and Partial Mapping Example

```tsx
const useMulti = buildQueryString(createZignal({ a: 0, b: 0 }), {
  key: { b: 'bkey' }, // Only 'b' is mapped to 'bkey', 'a' uses 'a' as the query key
  withStartValue: false,
});
```

### All Keys Synced by Default

If you omit the `key` option, all keys in your state will be mapped to the query string using their own names:

```tsx
const useAll = buildQueryString(createZignal({ foo: 1, bar: 2 }));
// Syncs 'foo' and 'bar' to ?foo=1&bar=2
```

### Custom Serialization

```tsx
const useCustom = buildQueryString(createZignal({ a: 0 }), {
  serialize: (v) => btoa(JSON.stringify(v)),
  deserialize: (v) => JSON.parse(atob(v)),
});
```

## API

### `buildQueryString(hook, options)`
Wraps a signal store hook to sync its value to the URL query string.

- `hook`: The hook returned by `createZignal`.
- `options.key`: Query string key(s). Can be:
  - `string`: single key
  - `string[]`: multiple keys
  - `{ [K in keyof State]?: string }`: partial or full mapping from state keys to query string keys
- `options.serialize`: Optional function to serialize the value to a string.
- `options.deserialize`: Optional function to parse the value from a string.
- `options.withStartValue` (default: `true`): If true, the initial state is written to the query string on first load. If false, only changes from the initial state are written.

## License

MIT License. 