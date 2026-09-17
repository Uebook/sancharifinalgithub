import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    NativeSyntheticEvent,
    NativeScrollEvent
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowTrendUp,
    faChevronRight,
    faClock,
    faStar,
    faUsers,
    faTag,
    faMountain,
    faLandmark,
    faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import apiClient, { getImageUrl } from '../../Services/apiClient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.72;
const CARD_MARGIN = 12;

export interface TrendingRouteItem {
    _id?: string;
    name: string;
    pickup?: string;
    destination?: string;
    subtitle?: string;
    startingPrice?: number | string;
    discount?: string;
    tag?: string;
    duration?: string;
    rating?: string | number;
    seats?: number | string;
    image?: string;
    category?: string;
    isActive?: boolean;
}

// Fallback high-quality curated routes matching the design if DB is empty or loading
const DEFAULT_TRENDING_ROUTES: TrendingRouteItem[] = [
    {
        _id: 'default-1',
        name: 'Hyderabad to Warangal',
        pickup: 'Hyderabad',
        destination: 'Warangal',
        subtitle: 'Heritage & Food Trail',
        startingPrice: 299,
        discount: 'Save up to 20%',
        tag: '🔥 Weekend Favorite',
        duration: '3h 15m',
        rating: 4.8,
        seats: 12,
        category: 'weekend_escape',
        image: 'https://images.unsplash.com/photo-1600100397608-f010f444b419?w=800&auto=format&fit=crop&q=80'
    },
    {
        _id: 'default-2',
        name: 'Hyderabad to Karimnagar',
        pickup: 'Hyderabad',
        destination: 'Karimnagar',
        subtitle: 'Regional Family Route',
        startingPrice: 349,
        discount: 'Save up to 15%',
        tag: '⭐ Family Popular',
        duration: '3h 30m',
        rating: 4.7,
        seats: 10,
        category: 'family',
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80'
    },
    {
        _id: 'default-3',
        name: 'Hyderabad to Nizamabad',
        pickup: 'Hyderabad',
        destination: 'Nizamabad',
        subtitle: 'Affordable Daily Travel',
        startingPrice: 399,
        discount: 'Save up to 15%',
        tag: '🛠️ Budget Route',
        duration: '4h 10m',
        rating: 4.6,
        seats: 8,
        category: 'budget',
        image: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&auto=format&fit=crop&q=80'
    },
    {
        _id: 'default-4',
        name: 'Hyderabad to Bhadrachalam',
        pickup: 'Hyderabad',
        destination: 'Bhadrachalam',
        subtitle: 'Temple Tourism Route',
        startingPrice: 599,
        discount: 'Save up to 10%',
        tag: '🏛️ Pilgrimage Special',
        duration: '6h 30m',
        rating: 4.9,
        seats: 6,
        category: 'pilgrimage',
        image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop&q=80'
    }
];

const CATEGORIES = [
    { id: 'all', label: 'All Routes', icon: faArrowTrendUp },
    { id: 'pilgrimage', label: 'Pilgrimage', icon: faLandmark },
    { id: 'budget', label: 'Budget', icon: faTag },
    { id: 'weekend_escape', label: 'Weekend Escapes', icon: faMountain },
    { id: 'family', label: 'Family Trips', icon: faUsers },
    { id: 'top_rated', label: 'Top Rated', icon: faStar }
];

interface Props {
    onSelectRoute: (route: TrendingRouteItem) => void;
    onViewAll?: () => void;
}

const TrendingRoutesSection: React.FC<Props> = ({ onSelectRoute, onViewAll }) => {
    const [routes, setRoutes] = useState<TrendingRouteItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        fetchPromotedRoutes();
    }, []);

    const fetchPromotedRoutes = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/pools/promoted');
            if (response.data && response.data.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
                // Filter routes that have pickup and destination or are trending
                const validRoutes = response.data.data.filter((r: any) => r.pickup || r.name);
                if (validRoutes.length > 0) {
                    setRoutes(validRoutes);
                } else {
                    setRoutes(DEFAULT_TRENDING_ROUTES);
                }
            } else {
                setRoutes(DEFAULT_TRENDING_ROUTES);
            }
        } catch (error) {
            console.log('Failed to fetch trending routes, using defaults:', error);
            setRoutes(DEFAULT_TRENDING_ROUTES);
        } finally {
            setLoading(false);
        }
    };

    const filteredRoutes = useMemo(() => {
        if (selectedCategory === 'all') return routes.length > 0 ? routes : DEFAULT_TRENDING_ROUTES;
        const filtered = routes.filter(r => {
            const cat = (r.category || '').toLowerCase();
            const tag = (r.tag || '').toLowerCase();
            const sub = (r.subtitle || '').toLowerCase();
            const target = selectedCategory.toLowerCase();

            if (target === 'pilgrimage') return cat.includes('pilgrim') || tag.includes('pilgrim') || sub.includes('temple');
            if (target === 'budget') return cat.includes('budget') || tag.includes('budget') || sub.includes('affordable') || Number(r.startingPrice) < 400;
            if (target === 'weekend_escape') return cat.includes('weekend') || tag.includes('weekend') || sub.includes('heritage') || sub.includes('escape');
            if (target === 'family') return cat.includes('family') || tag.includes('family') || sub.includes('family');
            if (target === 'top_rated') return Number(r.rating || 4.8) >= 4.7;
            return cat === target;
        });

        return filtered.length > 0 ? filtered : routes;
    }, [routes, selectedCategory]);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / (CARD_WIDTH + CARD_MARGIN));
        if (index >= 0 && index < filteredRoutes.length) {
            setActiveIndex(index);
        }
    };

    const getRouteImage = (route: TrendingRouteItem, index: number) => {
        if (route.image) {
            const resolved = getImageUrl(route.image);
            if (resolved) return { uri: resolved };
        }
        return { uri: DEFAULT_TRENDING_ROUTES[index % DEFAULT_TRENDING_ROUTES.length].image };
    };

    const getBadgeTag = (route: TrendingRouteItem, index: number) => {
        if (route.tag && route.tag.trim()) return route.tag.trim();
        const defaultTags = ['🔥 Weekend Favorite', '⭐ Family Popular', '🛠️ Budget Route', '🏛️ Pilgrimage Special'];
        return defaultTags[index % defaultTags.length];
    };

    const getRouteDuration = (route: TrendingRouteItem, index: number) => {
        if (route.duration) return route.duration;
        const defaultDurations = ['3h 15m', '3h 30m', '4h 10m', '6h 30m'];
        return defaultDurations[index % defaultDurations.length];
    };

    const getRouteRating = (route: TrendingRouteItem, index: number) => {
        if (route.rating) return route.rating.toString();
        const defaultRatings = ['4.8', '4.7', '4.6', '4.9'];
        return defaultRatings[index % defaultRatings.length];
    };

    const getRouteSeats = (route: TrendingRouteItem, index: number) => {
        if (route.seats) return route.seats.toString();
        const defaultSeats = ['12', '10', '8', '6'];
        return defaultSeats[index % defaultSeats.length];
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                    <View style={styles.trendIconCircle}>
                        <FontAwesomeIcon icon={faArrowTrendUp} size={15} color="#FFFFFF" />
                    </View>
                    <View style={styles.headerTitleColumn}>
                        <Text style={styles.sectionTitle}>Trending Routes in Telangana</Text>
                        <Text style={styles.sectionSubtitle}>
                            Popular routes this week for affordable outstation travel
                        </Text>
                    </View>
                </View>
                {onViewAll && (
                    <TouchableOpacity onPress={onViewAll} style={styles.viewAllBtn} activeOpacity={0.7}>
                        <Text style={styles.viewAllText}>View All</Text>
                        <FontAwesomeIcon icon={faChevronRight} size={11} color="#059669" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Cards Carousel */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#059669" />
                </View>
            ) : (
                <>
                    <ScrollView
                        ref={scrollRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.cardsScrollContent}
                        decelerationRate="fast"
                        snapToInterval={CARD_WIDTH + CARD_MARGIN}
                        snapToAlignment="start"
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                    >
                        {filteredRoutes.map((route, idx) => {
                            const pickup = route.pickup || (route.name.includes('to') ? route.name.split(/to|-/i)[0].trim() : 'Hyderabad');
                            const destination = route.destination || (route.name.includes('to') ? route.name.split(/to|-/i)[1]?.trim() : 'Warangal');
                            const startingPrice = route.startingPrice || (299 + idx * 50);
                            const discountText = route.discount ? (route.discount.includes('Save') ? route.discount : `Save up to ${route.discount}`) : `Save up to ${20 - idx * 5}%`;

                            return (
                                <View key={route._id || idx} style={styles.card}>
                                    {/* Top Image Container */}
                                    <View style={styles.cardImageWrapper}>
                                        <Image
                                            source={getRouteImage(route, idx)}
                                            style={styles.cardImage}
                                            resizeMode="cover"
                                        />
                                        {/* Badge Tag Overlay */}
                                        <View style={styles.tagBadge}>
                                            <Text style={styles.tagBadgeText}>{getBadgeTag(route, idx)}</Text>
                                        </View>
                                    </View>

                                    {/* Card Details */}
                                    <View style={styles.cardBody}>
                                        {/* Route Title with Arrow */}
                                        <View style={styles.routeHeader}>
                                            <Text style={styles.routeCity} numberOfLines={1}>{pickup}</Text>
                                            <FontAwesomeIcon icon={faArrowRight} size={12} color="#059669" style={{ marginHorizontal: 6 }} />
                                            <Text style={styles.routeCity} numberOfLines={1}>{destination}</Text>
                                        </View>

                                        {/* Subtitle */}
                                        <Text style={styles.routeSubtitle} numberOfLines={1}>
                                            {route.subtitle || 'Popular Outstation Route'}
                                        </Text>

                                        <View style={styles.dashedDivider} />

                                        {/* Pricing Row */}
                                        <View style={styles.priceRow}>
                                            <View>
                                                <Text style={styles.fromLabel}>From</Text>
                                                <Text style={styles.priceValue}>₹{startingPrice}</Text>
                                            </View>
                                            <View style={styles.discountPill}>
                                                <Text style={styles.discountText}>{discountText}</Text>
                                            </View>
                                        </View>

                                        {/* Meta Badges */}
                                        <View style={styles.metaRow}>
                                            <View style={styles.metaItem}>
                                                <FontAwesomeIcon icon={faClock} size={10} color="#6B7280" style={{ marginRight: 4 }} />
                                                <Text style={styles.metaText}>{getRouteDuration(route, idx)}</Text>
                                            </View>
                                            <View style={styles.metaItem}>
                                                <FontAwesomeIcon icon={faStar} size={10} color="#F59E0B" style={{ marginRight: 4 }} />
                                                <Text style={styles.metaText}>{getRouteRating(route, idx)}</Text>
                                            </View>
                                            <View style={styles.metaItem}>
                                                <FontAwesomeIcon icon={faUsers} size={10} color="#6B7280" style={{ marginRight: 4 }} />
                                                <Text style={styles.metaText}>{getRouteSeats(route, idx)} seats</Text>
                                            </View>
                                        </View>

                                        {/* Action Button */}
                                        <TouchableOpacity
                                            style={styles.bookBtn}
                                            onPress={() => onSelectRoute(route)}
                                            activeOpacity={0.85}
                                        >
                                            <Text style={styles.bookBtnText}>
                                                {idx === 1 ? 'Ride Now' : 'Book Ride'}
                                            </Text>
                                            <FontAwesomeIcon icon={faChevronRight} size={12} color="#FFFFFF" style={{ marginLeft: 6 }} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>

                    {/* Pagination Indicator Dots */}
                    {filteredRoutes.length > 1 && (
                        <View style={styles.paginationRow}>
                            {filteredRoutes.map((_, dotIdx) => (
                                <View
                                    key={dotIdx}
                                    style={[
                                        styles.dot,
                                        dotIdx === activeIndex ? styles.activeDot : styles.inactiveDot
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </>
            )}

            {/* Category Filter Chips */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScrollContent}
            >
                {CATEGORIES.map(cat => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                        <TouchableOpacity
                            key={cat.id}
                            style={[styles.categoryChip, isSelected && styles.activeCategoryChip]}
                            onPress={() => setSelectedCategory(cat.id)}
                            activeOpacity={0.7}
                        >
                            <FontAwesomeIcon
                                icon={cat.icon}
                                size={12}
                                color={isSelected ? '#059669' : '#6B7280'}
                                style={{ marginRight: 6 }}
                            />
                            <Text style={[styles.categoryChipText, isSelected && styles.activeCategoryChipText]}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        marginBottom: 80,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
        paddingRight: 12,
    },
    trendIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#059669',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        marginTop: 2,
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    headerTitleColumn: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.3,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
        lineHeight: 16,
    },
    viewAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingLeft: 8,
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#059669',
        marginRight: 4,
    },
    loadingContainer: {
        height: 240,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardsScrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginRight: CARD_MARGIN,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
        overflow: 'hidden',
    },
    cardImageWrapper: {
        width: '100%',
        height: 128,
        position: 'relative',
        backgroundColor: '#E5E7EB',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    tagBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 9,
        paddingVertical: 4.5,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },
    tagBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#1F2937',
    },
    cardBody: {
        padding: 14,
    },
    routeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 3,
    },
    routeCity: {
        fontSize: 15,
        fontWeight: '800',
        color: '#111827',
        maxWidth: '45%',
    },
    routeSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
        marginBottom: 10,
    },
    dashedDivider: {
        height: 1,
        borderWidth: 0.8,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        marginBottom: 10,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 10,
    },
    fromLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    priceValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#059669',
        letterSpacing: -0.5,
    },
    discountPill: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    discountText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#059669',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 10,
        marginBottom: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 11,
        color: '#4B5563',
        fontWeight: '600',
    },
    bookBtn: {
        backgroundColor: '#059669',
        borderRadius: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 2,
    },
    bookBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    paginationRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 16,
    },
    dot: {
        height: 6,
        borderRadius: 3,
        marginHorizontal: 3,
    },
    activeDot: {
        width: 18,
        backgroundColor: '#059669',
    },
    inactiveDot: {
        width: 6,
        backgroundColor: '#D1D5DB',
    },
    categoryScrollContent: {
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
    },
    activeCategoryChip: {
        backgroundColor: '#ECFDF5',
        borderColor: '#10B981',
    },
    categoryChipText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4B5563',
    },
    activeCategoryChipText: {
        color: '#059669',
    },
});

export default TrendingRoutesSection;
