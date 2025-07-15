# @zignal/paramagic

[![npm version](https://img.shields.io/npm/v/@zignal/paramagic.svg)](https://www.npmjs.com/package/@zignal/paramagic)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@zignal/paramagic)](https://bundlephobia.com/result?p=@zignal/paramagic)
[![npm downloads](https://img.shields.io/npm/dm/@zignal/paramagic.svg)](https://www.npmjs.com/package/@zignal/paramagic)

Paramagic plugin for [@zignal/core](https://github.com/Zignal-React/zignal-core) signal stores. Syncs your state to and from the URL query string for shareable, bookmarkable, and reload-persistent state.

## Install

```sh
npm install @zignal/core
npm install @zignal/paramagic
# or
yarn add @zignal/core
yarn add @zignal/paramagic
# or
pnpm add @zignal/core
pnpm add @zignal/paramagic
```

> You must also install [`@zignal/core`](https://github.com/Zignal-React/zignal-core).

## Usage

```tsx
import { createZignal } from '@zignal/core';
import { paramagic } from '@zignal/paramagic';

const useCounter = createZignal(0);
const useCounterWithUrl = paramagic(useCounter, { key: 'counter' });

function Counter() {
  const [count, setCount] = useCounterWithUrl();
  // The count is now synced with the URL query string!
}
```

## API

### `paramagic(hook, options)`
Wraps a signal store hook to sync its value to the URL query string.

- `hook`: The hook returned by `createZignal`.
- `options.key`: Query string key (string, required).
- `options.serialize`: Optional function to serialize the value to a string.
- `options.deserialize`: Optional function to parse the value from a string.

---
MIT License. 