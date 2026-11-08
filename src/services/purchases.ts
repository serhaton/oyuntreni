import Constants, { ExecutionEnvironment } from 'expo-constants';

import { PREMIUM } from '@/config/premium';

/**
 * In-app purchase service: the ONLY place that talks to the App Store.
 *
 * One non-consumable product unlocks the full game. Two implementations sit
 * behind the same interface:
 *  - `appStore`: real StoreKit 2 purchases through expo-iap (development
 *    builds, TestFlight, App Store). No third-party servers, no data collected.
 *  - `testStore`: used automatically inside Expo Go, which can't run native
 *    purchase code. "Buying" there just succeeds, so the game stays testable.
 */

export type BuyResult = 'purchased' | 'cancelled' | 'pending' | 'failed';

export interface Store {
  kind: 'app-store' | 'test';
  /** Connects to the store and replays unfinished purchases into `onOwned`. */
  init(onOwned: () => void): Promise<void>;
  /** Localized price, e.g. "₺99,99" or "$4.99" (null if unknown / offline). */
  getPrice(): Promise<string | null>;
  /** Does the App Store say this Apple ID owns premium? */
  ownsPremium(): Promise<boolean>;
  buy(): Promise<BuyResult>;
  /** Asks the App Store for past purchases; true if premium was found. */
  restore(): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// Test store (Expo Go)
// ---------------------------------------------------------------------------

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const testStore: Store = {
  kind: 'test',
  async init() {},
  async getPrice() {
    return null;
  },
  async ownsPremium() {
    return false;
  },
  async buy() {
    await wait(700); // feel a little like a real purchase sheet
    return 'purchased';
  },
  async restore() {
    await wait(500);
    return false;
  },
};

// ---------------------------------------------------------------------------
// Real App Store (StoreKit 2 via expo-iap)
// ---------------------------------------------------------------------------

/** expo-iap is loaded lazily: its native module doesn't exist inside Expo Go. */
function iap(): typeof import('expo-iap') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-iap');
}

let connected: Promise<void> | null = null;
let pendingBuy: ((result: BuyResult) => void) | null = null;

const appStore: Store = {
  kind: 'app-store',

  init(onOwned) {
    connected ??= (async () => {
      const store = iap();
      await store.initConnection();
      // Purchases arrive through listeners (including unfinished ones replayed
      // at launch, e.g. after a crash or an interrupted purchase).
      store.purchaseUpdatedListener(async (purchase) => {
        if (purchase.productId !== PREMIUM.productId) return;
        if (purchase.purchaseState === 'pending') {
          pendingBuy?.('pending'); // e.g. "Ask to Buy": a parent must approve
          pendingBuy = null;
          return;
        }
        try {
          await store.finishTransaction({ purchase, isConsumable: false });
        } catch (e) {
          console.warn('[purchases] finishTransaction failed', e);
        }
        onOwned();
        pendingBuy?.('purchased');
        pendingBuy = null;
      });
      store.purchaseErrorListener((error) => {
        const cancelled = error.code === store.ErrorCode.UserCancelled;
        if (!cancelled) console.warn('[purchases] purchase error', error.code, error.message);
        pendingBuy?.(cancelled ? 'cancelled' : 'failed');
        pendingBuy = null;
      });
    })();
    return connected;
  },

  async getPrice() {
    try {
      await connected;
      const products = await iap().fetchProducts({ skus: [PREMIUM.productId], type: 'in-app' });
      const product = products?.find((p) => p.id === PREMIUM.productId);
      return product?.displayPrice ?? null;
    } catch (e) {
      console.warn('[purchases] could not load the price', e);
      return null;
    }
  },

  async ownsPremium() {
    try {
      await connected;
      const purchases = await iap().getAvailablePurchases();
      return purchases.some((p) => p.productId === PREMIUM.productId);
    } catch (e) {
      console.warn('[purchases] could not read purchases', e);
      return false;
    }
  },

  async buy() {
    await connected;
    return new Promise<BuyResult>((resolve) => {
      pendingBuy = resolve;
      iap()
        .requestPurchase({ request: { apple: { sku: PREMIUM.productId } }, type: 'in-app' })
        .catch((e: unknown) => {
          console.warn('[purchases] requestPurchase failed', e);
          pendingBuy?.('failed');
          pendingBuy = null;
        });
    });
  },

  async restore() {
    try {
      await connected;
      await iap().restorePurchases();
      return await appStore.ownsPremium();
    } catch (e) {
      console.warn('[purchases] restore failed', e);
      return false;
    }
  },
};

/** Expo Go can't run native purchase code, so it gets the test store. */
export const store: Store =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ? testStore : appStore;
