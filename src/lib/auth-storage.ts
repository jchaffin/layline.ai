import { useAuth } from "@/hooks/use-auth";

// Helper functions for authenticated storage
export function useAuthenticatedStorage() {
  const { user, isAuthenticated } = useAuth();

  const getStorageKey = (key: string) => {
    if (isAuthenticated && user?.id) {
      return `user:${user.id}:${key}`;
    }
    return `guest:${key}`;
  };

  const setItem = (key: string, value: any) => {
    try {
      const storageKey = getStorageKey(key);
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
      console.error("Error saving to storage:", error);
    }
  };

  const getItem = (key: string) => {
    try {
      const storageKey = getStorageKey(key);
      const item = localStorage.getItem(storageKey);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error("Error reading from storage:", error);
      return null;
    }
  };

  const removeItem = (key: string) => {
    try {
      const storageKey = getStorageKey(key);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Error removing from storage:", error);
    }
  };

  const migrateFromGuestStorage = (keys: string[]) => {
    if (!isAuthenticated || !user?.id) return;

    keys.forEach(key => {
      const guestKey = `guest:${key}`;
      const userKey = `user:${user.id}:${key}`;
      
      const guestData = localStorage.getItem(guestKey);
      if (guestData && !localStorage.getItem(userKey)) {
        localStorage.setItem(userKey, guestData);
        localStorage.removeItem(guestKey);
      }
    });
  };

  return {
    setItem,
    getItem,
    removeItem,
    migrateFromGuestStorage,
    isAuthenticated,
    userId: user?.id,
  };
}
