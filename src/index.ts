import { useEffect, useRef } from 'react';
import type { ZignalStore } from '@zignal/core';

export type ParamagicOptions<T> = {
	key: string | (keyof T & string)[];
	serialize?: (value: any, key: string) => string;
	deserialize?: (value: string, key: string) => any;
	syncInitZignal?: boolean;
};

function isEmpty(val: any) {
	return val === null || val === undefined || val === '';
}

function isObject(val: any): val is Record<string, any> {
	return typeof val === 'object' && val !== null && !Array.isArray(val);
}

export function buildQueryString<T extends Record<string, any> | any>(
	hook: (() => [T, (v: T) => void]) & { store: ZignalStore<T> },
	options: ParamagicOptions<T>
) {
	const { key, serialize, deserialize, syncInitZignal = true } = options;
	const keys = Array.isArray(key) ? key : [key];

	function getFromUrl(): Partial<T> | T | undefined {
		const params = new URLSearchParams(window.location.search);
		if (Array.isArray(key)) {
			const result: Record<string, any> = {};
			let found = false;
			for (const k of keys) {
				const raw = params.get(k);
				if (raw != null) {
					found = true;
					try {
						result[k] = deserialize ? deserialize(raw, k) : JSON.parse(raw);
					} catch {
						// skip
					}
				}
			}
			return found ? (result as Partial<T>) : undefined;
		} else {
			const raw = params.get(key);
			if (raw == null) return undefined;
			try {
				return deserialize ? deserialize(raw, key) : (JSON.parse(raw) as T);
			} catch {
				return undefined;
			}
		}
	}

	function setToUrl(value: T, initialValue: T | null) {
		const params = new URLSearchParams(window.location.search);
		if (Array.isArray(key)) {
			if (isObject(value)) {
				for (const k of keys) {
					const v = value[k];
					// Only sync if not initial value or if syncInitZignal is true
					const initial = isObject(initialValue) ? initialValue[k] : undefined;
					if (
						isEmpty(v) ||
						(!syncInitZignal && v === initial)
					) {
						params.delete(k);
					} else {
						const str = serialize ? serialize(v, k) : JSON.stringify(v);
						params.set(k, str);
					}
				}
			}
		} else {
			const initial = initialValue;
			if (
				isEmpty(value) ||
				(!syncInitZignal && value === initial)
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
				if (Array.isArray(key) && isObject(state) && isObject(urlValue)) {
					origSet({ ...state, ...urlValue } as T);
				} else {
					origSet(urlValue as T);
				}
			} else if (syncInitZignal) {
				setToUrl(state, initialValueRef.current);
			}
			const onPop = () => {
				const urlValue = getFromUrl();
				if (urlValue !== undefined) {
					if (Array.isArray(key) && isObject(hook.store.get()) && isObject(urlValue)) {
						origSet({ ...(hook.store.get() as object), ...(urlValue as object) } as T);
					} else {
						origSet(urlValue as T);
					}
				}
			};
			window.addEventListener('popstate', onPop);
			return () => window.removeEventListener('popstate', onPop);
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [JSON.stringify(keys), syncInitZignal]);

		useEffect(() => {
			return hook.store.subscribe(() => {
				setToUrl(hook.store.get(), initialValueRef.current);
			});
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [JSON.stringify(keys)]);

		return [state, setState] as [T, (v: T) => void];
	}

	(useBuildQueryString as typeof hook).store = hook.store;
	return useBuildQueryString;
} 