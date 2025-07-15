import { useEffect, useRef } from 'react';
import type { ZignalStore } from '@zignal/core';

export type KeyMapping<T> =
	| string
	| (keyof T & string)[]
	| { [K in keyof T & string]?: string };

export type ParamagicOptions<T> = {
	key?: KeyMapping<T>;
	serialize?: (value: unknown, key: string) => string;
	deserialize?: (value: string, key: string) => unknown;
	withStartValue?: boolean;
};

function isEmpty(val: unknown): boolean {
	return val === null || val === undefined || val === '';
}

function isObject(val: unknown): val is Record<string, unknown> {
	return typeof val === 'object' && val !== null && !Array.isArray(val);
}

export function buildQueryString<T extends Record<string, unknown> | unknown>(
	hook: (() => [T, (v: T) => void]) & { store: ZignalStore<T> },
	options: ParamagicOptions<T> = {}
) {
	const { key, serialize, deserialize, withStartValue = true } = options;

	// Add index signatures for string indexing
	const queryToState: Record<string, string> = {};
	let stateToQuery: Record<string, string> = {};
	let keys: string[] = [];

	const initial = hook.store.get();

	if (typeof key === 'string') {
		keys = [key];
		stateToQuery[key] = key;
		queryToState[key] = key;
	} else if (Array.isArray(key)) {
		keys = key;
		for (const k of key) {
			stateToQuery[k] = k;
			queryToState[k] = k;
		}
	} else if (typeof key === 'object' && key !== null) {
		if (isObject(initial)) {
			keys = Object.keys(initial);
			stateToQuery = {};
			for (const stateKey of keys) {
				const queryKey = key[stateKey as keyof typeof key] ?? stateKey;
				stateToQuery[stateKey] = queryKey;
				queryToState[queryKey] = stateKey;
			}
		} else {
			keys = Object.keys(key);
			stateToQuery = {};
			for (const stateKey of keys) {
				const queryKey = key[stateKey as keyof typeof key] ?? stateKey;
				stateToQuery[stateKey] = queryKey;
				queryToState[queryKey] = stateKey;
			}
		}
	} else if (isObject(initial)) {
		keys = Object.keys(initial);
		for (const k of keys) {
			stateToQuery[k] = k;
			queryToState[k] = k;
		}
	} else {
		// primitive fallback
		keys = [];
	}

	function getFromUrl(): Partial<T> | T | undefined {
		const params = new URLSearchParams(window.location.search);
		if (keys.length > 0) {
			const result: Record<string, unknown> = {};
			let found = false;
			for (const stateKey of keys) {
				const queryKey = stateToQuery[stateKey as keyof typeof stateToQuery];
				const raw = params.get(queryKey);
				if (raw != null) {
					found = true;
					try {
						result[stateKey] = deserialize ? deserialize(raw, queryKey) : JSON.parse(raw);
					} catch {
						// skip
					}
				}
			}
			return found ? (result as Partial<T>) : undefined;
		} else if (typeof key === 'string') {
			const raw = params.get(key);
			if (raw == null) return undefined;
			try {
				return deserialize ? (deserialize(raw, key) as T) : (JSON.parse(raw) as T);
			} catch {
				return undefined;
			}
		} else {
			return undefined;
		}
	}

	function setToUrl(value: T, initialValue: T | null) {
		const params = new URLSearchParams(window.location.search);
		if (keys.length > 0 && isObject(value)) {
			for (const stateKey of keys) {
				const queryKey = stateToQuery[stateKey as keyof typeof stateToQuery];
				const v = value[stateKey as keyof typeof value];
				const initial = isObject(initialValue) ? initialValue[stateKey] : undefined;
				if (
					isEmpty(v) ||
					(!withStartValue && v === initial)
				) {
					params.delete(queryKey);
				} else {
					const str = serialize ? serialize(v, queryKey) : JSON.stringify(v);
					params.set(queryKey, str);
				}
			}
		} else if (typeof key === 'string') {
			const initial = initialValue;
			if (
				isEmpty(value) ||
				(!withStartValue && value === initial)
			) {
				params.delete(key);
			} else {
				const str = serialize ? serialize(value, key) : JSON.stringify(value);
				params.set(key, str);
			}
		}
		const newQuery = params.toString();
		const newUrl = `${window.location.pathname}${newQuery ? '?' + newQuery : ''}${window.location.hash}`;
		window.history.replaceState(null, '', newUrl);
	}

	function useBuildQueryString() {
		const [state, setState] = hook();
		const origSet = hook.store.set;
		const initialValueRef = useRef<T | null>(null);
		if (initialValueRef.current === null) {
			initialValueRef.current = hook.store.get();
		}

		useEffect(() => {
			const urlValue = getFromUrl();
			if (urlValue !== undefined) {
				if (keys.length > 0 && isObject(state) && isObject(urlValue)) {
					origSet({ ...state, ...urlValue } as T);
				} else {
					origSet(urlValue as T);
				}
			} else if (withStartValue) {
				setToUrl(state, initialValueRef.current);
			}
			const onPop = () => {
				const urlValue = getFromUrl();
				if (urlValue !== undefined) {
					if (keys.length > 0 && isObject(hook.store.get()) && isObject(urlValue)) {
						origSet({ ...(hook.store.get() as object), ...(urlValue as object) } as T);
					} else {
						origSet(urlValue as T);
					}
				}
			};
			window.addEventListener('popstate', onPop);
			return () => window.removeEventListener('popstate', onPop);
		}, [JSON.stringify(keys), withStartValue]);

		useEffect(() => {
			return hook.store.subscribe(() => {
				setToUrl(hook.store.get(), initialValueRef.current);
			});
		}, [JSON.stringify(keys)]);

		return [state, setState] as [T, (v: T) => void];
	}

	(useBuildQueryString as typeof hook).store = hook.store;
	return useBuildQueryString;
} 