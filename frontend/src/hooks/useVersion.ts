import { useState, useEffect } from 'react';
import { getPublicOrganization } from '@/api/organization';

let cachedVersion = '';
let cachedDevmode = false;
let cachedCurrency = 'DH';

export function getCurrency(): string {
  return cachedCurrency;
}

export function useVersion(): { version: string; devmode: boolean; currency: string } {
  const [version, setVersion] = useState(cachedVersion);
  const [devmode, setDevmode] = useState(cachedDevmode);
  const [currency, setCurrency] = useState(cachedCurrency);

  useEffect(() => {
    if (cachedVersion) {
      setVersion(cachedVersion);
      setDevmode(cachedDevmode);
      setCurrency(cachedCurrency);
      return;
    }
    getPublicOrganization().then((res) => {
      if (res) {
        const v = res.version || '';
        const b = res.build || '';
        cachedVersion = v + (b ? `+${b}` : '');
        cachedDevmode = res.devmode;
        cachedCurrency = res.currency || 'DH';
        setVersion(cachedVersion);
        setDevmode(cachedDevmode);
        setCurrency(cachedCurrency);
      }
    });
  }, []);

  return { version, devmode, currency };
}