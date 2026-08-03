import { useEffect, useState } from "react";

export function usePersistentState<T>(key: string, fallback: T, parse: (value: string) => T, serialize: (value: T) => string = String) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored === null ? fallback : parse(stored);
  });

  useEffect(() => { localStorage.setItem(key, serialize(value)); }, [key, serialize, value]);
  return [value, setValue] as const;
}
