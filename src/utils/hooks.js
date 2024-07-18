import { useEffect, useState } from 'react';

export function useLocalStorage(key, defaultValue) {
  const serialize = () => {
    let currentValue;
    try {
      currentValue = JSON.parse(
        localStorage.getItem(key) || String(defaultValue)
      );
    } catch (error) {
      currentValue = defaultValue;
    }
    return currentValue;
  }
  const [value, setValue] = useState(serialize);
  const handleChange = () => setValue(serialize)

  useEffect(() => {
    window.addEventListener('storage', handleChange)
    return () => window.removeEventListener('storage', handleChange)
  })

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [value, key]);

  return [value, setValue];
}
