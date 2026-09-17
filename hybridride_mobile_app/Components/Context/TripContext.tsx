
import React, { createContext, useState, useContext, ReactNode } from 'react';

export interface Passenger {
    id: string;
    initial: string;
    color: string;
}

export interface DriverDetails {
    name: string;
    rating: number;
    carModel: string;
}

export interface Trip {
    id: string;
    date: string; // Format: "DD-MMM-YYYY, HH:MM AM/PM" or similar for display
    origin: string;
    destination: string;
    price: string;
    bookedSeats: number;
    totalSeats: number;
    passengers: Passenger[];
    type: 'City' | 'Outstation' | 'Rental';
    status: 'Upcoming' | 'Past';
    driver: DriverDetails; // Add explicitly passed driver details
}

interface TripContextType {
    trips: Trip[];
    addTrip: (trip: Trip) => void;
    bookSeat: (tripId: string, passenger: Passenger, seatsToBook?: number) => boolean;
    updateTripStatus: (tripId: string, status: 'Upcoming' | 'Past') => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider = ({ children }: { children: ReactNode }) => {
    // Initial Mock Data can be here if needed, or empty
    const [trips, setTrips] = useState<Trip[]>([
        {
            id: '1',
            date: 'TOMORROW, 09:00 AM',
            origin: 'San Francisco',
            destination: 'Los Angeles',
            price: '$45',
            bookedSeats: 2,
            totalSeats: 3,
            passengers: [
                { id: 'p1', initial: 'S', color: '#FBCFE8' },
                { id: 'p2', initial: 'M', color: '#BFDBFE' },
            ],
            type: 'City',
            status: 'Upcoming',
            driver: {
                name: "John Doe",
                rating: 4.8,
                carModel: "Tesla Model 3"
            }
        }
    ]);

    const addTrip = (trip: Trip) => {
        setTrips((prevTrips) => [trip, ...prevTrips]);
    };

    const bookSeat = (tripId: string, passenger: Passenger, seatsToBook: number = 1) => {
        let success = false;
        setTrips((prevTrips) =>
            prevTrips.map((trip) => {
                if (trip.id === tripId) {
                    if (trip.bookedSeats + seatsToBook <= trip.totalSeats) {
                        success = true;
                        return {
                            ...trip,
                            bookedSeats: trip.bookedSeats + seatsToBook,
                            passengers: [...trip.passengers, passenger],
                        };
                    }
                }
                return trip;
            })
        );
        return success;
    };

    const updateTripStatus = (tripId: string, status: 'Upcoming' | 'Past') => {
        setTrips((prevTrips) =>
            prevTrips.map((trip) =>
                trip.id === tripId ? { ...trip, status } : trip
            )
        );
    };

    return (
        <TripContext.Provider value={{ trips, addTrip, bookSeat, updateTripStatus }}>
            {children}
        </TripContext.Provider>
    );
};

export const useTrips = () => {
    const context = useContext(TripContext);
    if (!context) {
        throw new Error('useTrips must be used within a TripProvider');
    }
    return context;
};
