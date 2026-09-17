import apiClient from './apiClient';

export interface PoolRide {
    _id: string;
    type: 'local' | 'outstation' | 'intercity';
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    origin: {
        name: string;
        location: { type: 'Point'; coordinates: [number, number] };
    };
    destination: {
        name: string;
        location: { type: 'Point'; coordinates: [number, number] };
    };
    scheduledTime: string;
    vehicle?: string;
    totalSeats: number;
    availableSeats: number;
    pricePerSeat: number;
    seatPricing?: {
        front: number;
        middle: number;
        back: number;
    };
    host: {
        _id: string;
        name: string;
        phone: string;
        profileImage: string;
        driverDetails?: {
            ratings?: {
                average: number;
                count: number;
            };
            vehicle?: {
                make: string;
                model: string;
                plateNumber: string;
            };
        };
    };
    preferences?: {
        music: boolean;
        ac: boolean;
        quiet: boolean;
        pets: boolean;
    };
    route?: {
        distance?: number;
        duration?: number;
    };
    passengers?: Array<{
        user: {
            _id: string;
            name: string;
            phone: string;
            profileImage?: string;
        };
        seatsBooked: number;
        bookingStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed';
        cancellationReason?: string;
    }>;
}

export const poolService = {
    searchRides: async (type?: string, date?: string, fromCoords?: any, toCoords?: any) => {
        const params: any = {};
        if (type) params.type = type;
        if (date && date !== 'dd-mm-yyyy') params.date = date;

        if (fromCoords) {
            params.fromCoords = Array.isArray(fromCoords) ? `${fromCoords[0]},${fromCoords[1]}` : String(fromCoords);
        }
        if (toCoords) {
            params.toCoords = Array.isArray(toCoords) ? `${toCoords[0]},${toCoords[1]}` : String(toCoords);
        }

        const response = await apiClient.get('/pools/search', { params });
        return response.data; // { success: boolean, data: PoolRide[] }
    },

    publishRide: async (payload: any) => {
        const response = await apiClient.post('/pools/publish', payload);
        return response.data; // { success: boolean, data: PoolRide }
    },

    bookSeat: async (rideId: string, seats: number = 1, paymentMethod: string = 'cash') => {
        const response = await apiClient.post(`/pools/${rideId}/book`, { seats, paymentMethod });
        return response.data; // { success: boolean, data: PoolRide }
    },

    getPassengerHistory: async () => {
        const response = await apiClient.get('/pools/history');
        return response.data; // { success: boolean, data: PoolRide[] }
    },

    getDriverHistory: async () => {
        const response = await apiClient.get('/pools/driver-history');
        return response.data; // { success: boolean, data: PoolRide[] }
    },

    updateTripStatus: async (tripId: string, status: string, cancellationReason?: string) => {
        const response = await apiClient.put(`/pools/${tripId}/status`, { status, cancellationReason });
        return response.data; // { success: boolean, data: PoolRide }
    },
    cancelBooking: async (rideId: string, cancellationReason: string) => {
        const response = await apiClient.put(`/pools/${rideId}/cancel-booking`, { cancellationReason });
        return response.data; // { success: boolean, data: PoolRide }
    }
};

export default poolService;
