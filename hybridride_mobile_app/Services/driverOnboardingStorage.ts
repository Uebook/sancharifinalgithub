import AsyncStorage from '@react-native-async-storage/async-storage';

export const DRIVER_ONBOARDING_STORAGE_KEY = '@sanchari_driver_onboarding_draft';

export interface DriverOnboardingDraft {
    userData?: any;
    vehicleType?: string;
    uploadedDocuments?: string[];
    capturedDocs?: Record<string, string>;
    lastUpdated?: number;
}

export const driverOnboardingStorage = {
    async getDraft(): Promise<DriverOnboardingDraft | null> {
        try {
            const json = await AsyncStorage.getItem(DRIVER_ONBOARDING_STORAGE_KEY);
            if (!json) return null;
            return JSON.parse(json);
        } catch (error) {
            console.error('Error reading driver onboarding draft:', error);
            return null;
        }
    },

    async saveDraft(partialDraft: Partial<DriverOnboardingDraft>): Promise<void> {
        try {
            const existing = (await driverOnboardingStorage.getDraft()) || {};
            const merged: DriverOnboardingDraft = {
                ...existing,
                ...partialDraft,
                userData: {
                    ...(existing.userData || {}),
                    ...(partialDraft.userData || {}),
                    vehicle: {
                        ...(existing.userData?.vehicle || {}),
                        ...(partialDraft.userData?.vehicle || {})
                    }
                },
                capturedDocs: {
                    ...(existing.capturedDocs || {}),
                    ...(partialDraft.capturedDocs || {})
                },
                uploadedDocuments: Array.from(new Set([
                    ...(existing.uploadedDocuments || []),
                    ...(partialDraft.uploadedDocuments || [])
                ])),
                vehicleType: partialDraft.vehicleType || existing.vehicleType || 'CAR',
                lastUpdated: Date.now()
            };
            await AsyncStorage.setItem(DRIVER_ONBOARDING_STORAGE_KEY, JSON.stringify(merged));
        } catch (error) {
            console.error('Error saving driver onboarding draft:', error);
        }
    },

    async clearDraft(): Promise<void> {
        try {
            await AsyncStorage.removeItem(DRIVER_ONBOARDING_STORAGE_KEY);
        } catch (error) {
            console.error('Error clearing driver onboarding draft:', error);
        }
    }
};
