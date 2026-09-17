import apiClient from './apiClient';

// ─────────────────────────────────────────────────────────
// bookingService.ts
// All ride booking API calls for the React Native app
// ─────────────────────────────────────────────────────────

export interface BookingRequestPayload {
    pickupAddress: string;
    pickupCoords: [number, number];       // [lng, lat]
    dropoffAddress: string;
    dropoffCoords: [number, number];
    rideType?: 'city' | 'outstation' | 'pool' | 'rental';
    vehicleType?: 'CAR' | 'BIKE' | 'AUTO';
    seats?: number;
    distanceKm?: number;
    durationMins?: number;
    offeredFare?: number;
    paymentMethod?: 'cash' | 'wallet';
}

// POST /api/bookings/request  →  Passenger requests a ride
export const requestRide = async (payload: BookingRequestPayload) => {
    const response = await apiClient.post('/bookings/request', payload);
    return response.data; // { success, data: Booking }
};

// GET /api/bookings/nearby  →  Driver fetches pending rides
export const getNearbyRides = async (vehicleType?: string) => {
    const params = vehicleType ? { vehicleType } : {};
    const response = await apiClient.get('/bookings/nearby', { params });
    return response.data; // { success, data: Booking[] }
};

// POST /api/bookings/:id/accept  →  Driver accepts a ride
export const acceptRide = async (bookingId: string) => {
    const response = await apiClient.post(`/bookings/${bookingId}/accept`);
    return response.data; // { success, data: Booking }
};

// PUT /api/bookings/:id/status  →  Update status (arrived/ongoing/completed/cancelled)
export const updateRideStatus = async (
    bookingId: string,
    status: 'arrived' | 'ongoing' | 'completed' | 'cancelled',
    cancellationReason?: string,
    otp?: string
) => {
    const response = await apiClient.put(`/bookings/${bookingId}/status`, {
        status,
        cancellationReason,
        otp,
    });
    return response.data;
};

// GET /api/bookings/active  →  Get current active ride
export const getActiveRide = async () => {
    const response = await apiClient.get('/bookings/active');
    return response.data; // { success, data: Booking | null }
};

// GET /api/driver/online → Get online drivers
export const getOnlineDrivers = async () => {
    const response = await apiClient.get('/driver/online');
    return response.data;
};

// GET /api/driver/earnings → Get driver dynamic earnings
export const getDriverEarnings = async () => {
    const response = await apiClient.get('/driver/earnings');
    return response.data;
};

// GET /api/bookings/history  →  Ride history (paginated)
export const getRideHistory = async (page = 1, limit = 10) => {
    const response = await apiClient.get('/bookings/history', { params: { page, limit } });
    return response.data;
};

// POST /api/bookings/:id/rate  →  Rate a completed ride
export const rateRide = async (bookingId: string, rating: number, comment?: string) => {
    const response = await apiClient.post(`/bookings/${bookingId}/rate`, { rating, comment });
    return response.data;
};

// GET /api/bookings/:id  →  Get a single booking by ID
export const getBookingById = async (bookingId: string) => {
    const response = await apiClient.get(`/bookings/${bookingId}`);
    return response.data;
};

// GET /api/bookings/:id/messages  →  Get messages for an active ride
export const getMessages = async (bookingId: string) => {
    const response = await apiClient.get(`/bookings/${bookingId}/messages`);
    return response.data;
};

// POST /api/bookings/:id/messages  →  Send a text message
export const sendMessage = async (bookingId: string, text: string) => {
    const response = await apiClient.post(`/bookings/${bookingId}/messages`, { text });
    return response.data;
};
