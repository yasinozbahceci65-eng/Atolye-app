const storage = typeof window !== 'undefined' ? window.localStorage : null;

export const asyncStorage = {
  async getItem(key: string): Promise<string | null> {
    return storage?.getItem(key) ?? null;
  },
  async setItem(key: string, value: string): Promise<void> {
    storage?.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    storage?.removeItem(key);
  },
};

export const netInfo = {
  addEventListener(listener: (state: { isConnected: boolean }) => void): () => void {
    listener({ isConnected: true });
    return () => {};
  },
};
