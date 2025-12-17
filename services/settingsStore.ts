const STORE_FILE = 'settings.json';
const API_KEY_KEY = 'gemini_api_key';
const LOCALSTORAGE_KEY = 'nano_bananary_api_key';

// Check if we're running in Tauri
const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

let storeInstance: Awaited<ReturnType<typeof import('@tauri-apps/plugin-store').load>> | null = null;

async function getStore() {
  if (!isTauri()) {
    return null;
  }
  
  if (!storeInstance) {
    const { load } = await import('@tauri-apps/plugin-store');
    storeInstance = await load(STORE_FILE, { autoSave: true });
  }
  return storeInstance;
}

export async function getApiKey(): Promise<string | null> {
  try {
    if (isTauri()) {
      const store = await getStore();
      if (store) {
        const key = await store.get<string>(API_KEY_KEY);
        return key ?? null;
      }
    }
    // Fallback to localStorage for web environment
    return localStorage.getItem(LOCALSTORAGE_KEY);
  } catch (error) {
    console.error('Failed to get API key from store:', error);
    // Try localStorage as fallback
    return localStorage.getItem(LOCALSTORAGE_KEY);
  }
}

export async function setApiKey(key: string): Promise<void> {
  try {
    if (isTauri()) {
      const store = await getStore();
      if (store) {
        await store.set(API_KEY_KEY, key);
        await store.save();
      }
    }
    // Also save to localStorage for web environment and as backup
    localStorage.setItem(LOCALSTORAGE_KEY, key);
  } catch (error) {
    console.error('Failed to save API key to store:', error);
    // Try localStorage as fallback
    localStorage.setItem(LOCALSTORAGE_KEY, key);
  }
}

export async function hasApiKey(): Promise<boolean> {
  const key = await getApiKey();
  return !!key && key.trim().length > 0;
}
