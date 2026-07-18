import { AsyncLocalStorage } from "node:async_hooks";

export interface TenantContextValue {
  tenantId: string;
  userId?: string;
}

const storage = new AsyncLocalStorage<TenantContextValue>();

export const TenantContext = {
  current(): TenantContextValue | undefined {
    return storage.getStore();
  },
  run<T>(value: TenantContextValue, callback: () => T): T {
    return storage.run(value, callback);
  },
};
