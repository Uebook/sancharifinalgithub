import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedLocation {
    id: string;
    title: string;
    subtitle: string;
    coords?: [number, number];
    type: 'home' | 'work' | 'favorite' | 'recent';
    count?: number;
}

const STORAGE_KEYS = {
    HOME: '@saved_home_address',
    WORK: '@saved_work_address',
    RECENTS: '@recent_location_history',
    FAVORITES: '@custom_saved_favorites',
};

export const getHomeAddress = async (): Promise<SavedLocation | null> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.HOME);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
};

export const setHomeAddress = async (subtitle: string, coords?: [number, number]): Promise<SavedLocation> => {
    const item: SavedLocation = { id: 'home', title: 'Home', subtitle, coords, type: 'home' };
    await AsyncStorage.setItem(STORAGE_KEYS.HOME, JSON.stringify(item));
    return item;
};

export const getWorkAddress = async (): Promise<SavedLocation | null> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.WORK);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
};

export const setWorkAddress = async (subtitle: string, coords?: [number, number]): Promise<SavedLocation> => {
    const item: SavedLocation = { id: 'work', title: 'Work', subtitle, coords, type: 'work' };
    await AsyncStorage.setItem(STORAGE_KEYS.WORK, JSON.stringify(item));
    return item;
};

export const getRecentHistory = async (): Promise<SavedLocation[]> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.RECENTS);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

export const getRecentLocations = getRecentHistory;
export const getRecentLocation = getRecentHistory;

export const addRecentLocation = async (title: string, subtitle: string, coords?: [number, number]) => {
    try {
        if (!title || !title.trim()) return;
        const current = await getRecentHistory();
        const existingIdx = current.findIndex(item => item.title.toLowerCase() === title.toLowerCase());
        
        let updated: SavedLocation[] = [];
        if (existingIdx !== -1) {
            const existing = current[existingIdx];
            const updatedItem = {
                ...existing,
                subtitle: subtitle || existing.subtitle,
                coords: coords || existing.coords,
                count: (existing.count || 1) + 1,
            };
            current.splice(existingIdx, 1);
            updated = [updatedItem, ...current];
        } else {
            const newItem: SavedLocation = {
                id: Date.now().toString(),
                title,
                subtitle: subtitle || title,
                coords,
                type: 'recent',
                count: 1,
            };
            updated = [newItem, ...current.slice(0, 15)];
        }
        await AsyncStorage.setItem(STORAGE_KEYS.RECENTS, JSON.stringify(updated));
    } catch (e) {
        console.error('Error saving recent location:', e);
    }
};

export const removeRecentLocation = async (id: string): Promise<SavedLocation[]> => {
    try {
        const current = await getRecentHistory();
        const updated = current.filter(item => item.id !== id);
        await AsyncStorage.setItem(STORAGE_KEYS.RECENTS, JSON.stringify(updated));
        return updated;
    } catch {
        return [];
    }
};

export const clearRecentHistory = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(STORAGE_KEYS.RECENTS);
    } catch (e) {
        console.error('Error clearing recent history:', e);
    }
};

export const getFavorites = async (): Promise<SavedLocation[]> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

export const addFavoritePlace = async (title: string, subtitle: string, coords?: [number, number]): Promise<SavedLocation[]> => {
    try {
        const current = await getFavorites();
        const existingIdx = current.findIndex(item => item.title.toLowerCase() === title.toLowerCase());
        let updated: SavedLocation[];
        if (existingIdx !== -1) {
            updated = [...current];
            updated[existingIdx] = { ...current[existingIdx], subtitle, coords };
        } else {
            const newItem: SavedLocation = {
                id: 'fav_' + Date.now(),
                title,
                subtitle,
                coords,
                type: 'favorite'
            };
            updated = [newItem, ...current];
        }
        await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
        return updated;
    } catch (e) {
        console.error('Error adding favorite:', e);
        return [];
    }
};

export const removeFavorite = async (id: string): Promise<SavedLocation[]> => {
    try {
        const current = await getFavorites();
        const updated = current.filter(item => item.id !== id);
        await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
        return updated;
    } catch {
        return [];
    }
};

