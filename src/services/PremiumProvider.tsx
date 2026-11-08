import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { store, type BuyResult } from './purchases';
import { loadJSON, saveJSON } from './storage';

const KEY = 'premium';

interface PremiumContextValue {
  /** True once the full game is unlocked. */
  isPremium: boolean;
  /** False until the saved state has been read (the splash screen waits for it). */
  ready: boolean;
  /** Localized price from the App Store (null until loaded, offline, or in Expo Go). */
  price: string | null;
  /** 'test' inside Expo Go (purchases are simulated). */
  storeKind: 'app-store' | 'test';
  buy: () => Promise<BuyResult>;
  /** Restores a previous purchase (Apple requires offering this). True if found. */
  restore: () => Promise<boolean>;
  /** Test store only: take premium away again, to re-test the locked game. */
  revokeForTesting: () => void;
}

const PremiumContext = createContext<PremiumContextValue | null>(null);

/**
 * Knows whether the full game is unlocked. The last known state is cached on
 * the device so the game works offline; the App Store is asked on start-up
 * and can only ever turn premium ON (an offline store check never removes it).
 */
export function PremiumProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [ready, setReady] = useState(false);
  const [price, setPrice] = useState<string | null>(null);

  const grant = useCallback(() => {
    setIsPremium(true);
    void saveJSON(KEY, true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await loadJSON<boolean>(KEY);
      if (cancelled) return;
      if (cached === true) setIsPremium(true);
      setReady(true);
      try {
        await store.init(grant);
        if (await store.ownsPremium()) grant();
        const p = await store.getPrice();
        if (!cancelled) setPrice(p);
      } catch (e) {
        console.warn('[premium] store not available', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [grant]);

  const buy = useCallback(async () => {
    const result = await store.buy();
    if (result === 'purchased') grant();
    return result;
  }, [grant]);

  const restore = useCallback(async () => {
    const found = await store.restore();
    if (found) grant();
    return found;
  }, [grant]);

  const revokeForTesting = useCallback(() => {
    if (store.kind !== 'test') return;
    setIsPremium(false);
    void saveJSON(KEY, false);
  }, []);

  const value = useMemo<PremiumContextValue>(
    () => ({ isPremium, ready, price, storeKind: store.kind, buy, restore, revokeForTesting }),
    [isPremium, ready, price, buy, restore, revokeForTesting],
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium(): PremiumContextValue {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used inside <PremiumProvider>');
  return ctx;
}
