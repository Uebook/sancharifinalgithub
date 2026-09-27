import Counter from '../Models/Counter.js';

/**
 * Generate a sequential Application ID with standard format:
 * Passenger: SAN-P-000001
 * Driver:    SAN-D-000001
 * Admin:     SAN-A-000001
 */
export const getNextApplicationId = async (role = 'passenger') => {
    const normalizedRole = (role || 'passenger').toLowerCase();
    let counterKey = 'passenger_app_id';
    let prefix = 'SAN-P-';

    if (normalizedRole === 'driver') {
        counterKey = 'driver_app_id';
        prefix = 'SAN-D-';
    } else if (normalizedRole === 'admin') {
        counterKey = 'admin_app_id';
        prefix = 'SAN-A-';
    }

    const counter = await Counter.findByIdAndUpdate(
        counterKey,
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    const seqNumber = String(counter.seq).padStart(6, '0');
    return `${prefix}${seqNumber}`;
};
