
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../Context/AuthContext';

// Auth Screens
import EntryScreen from '../Screens/EntryScreen';
import UnifiedLoginScreen from '../Screens/UnifiedLoginScreen';
import PassengerLoginScreen from '../Screens/PassengerLoginScreen';
import OtpVerificationScreen from '../Screens/OtpVerificationScreen';
import ProfileSetupScreen from '../Screens/ProfileSetupScreen';
import DriverRegistrationScreen from '../Screens/DriverRegistrationScreen';
import DriverDocumentUploadScreen from '../Screens/DriverDocumentUploadScreen';
import DriverVehicleSelectionScreen from '../Screens/DriverVehicleSelectionScreen';
import DriverVehicleDetailsScreen from '../Screens/DriverVehicleDetailsScreen';

// Passenger Screens
import PassengerHomeScreen from '../Screens/PassengerHomeScreen';
import WalletScreen from '../Screens/WalletScreen';
import SupportScreen from '../Screens/SupportScreen';
import PassengerProfileScreen from '../Screens/PassengerProfileScreen';
import SettingsScreen from '../Screens/SettingsScreen';
import OutstationScreen from '../Screens/OutstationScreen';
import DropLocationScreen from '../Screens/DropLocationScreen';
import RideSelectionScreen from '../Screens/RideSelectionScreen';
import SeatPreferenceScreen from '../Screens/SeatPreferenceScreen';
import AvailableRidesScreen from '../Screens/AvailableRidesScreen';
import TripDetailsScreen from '../Screens/TripDetailsScreen';
import OfferFareScreen from '../Screens/OfferFareScreen';
import FindingDriverScreen from '../Screens/FindingDriverScreen';
import DriverOffersScreen from '../Screens/DriverOffersScreen';
import DriverAcceptedScreen from '../Screens/DriverAcceptedScreen';
import RideTrackingScreen from '../Screens/RideTrackingScreen';
import PoolingSuccessScreen from '../Screens/PoolingSuccessScreen';
import PassengerMyTripsScreen from '../Screens/PassengerMyTripsScreen';
import RideCompletedScreen from '../Screens/RideCompletedScreen';
import OutstationModesScreen from '../Screens/OutstationModesScreen';
import OutstationReviewScreen from '../Screens/OutstationReviewScreen';
import OutstationRideDetailScreen from '../Screens/OutstationRideDetailScreen';
import OutstationScheduledScreen from '../Screens/OutstationScheduledScreen';
import AppFeedbackScreen from '../Screens/AppFeedbackScreen';

// Driver Screens
import DriverHomeScreen from '../Screens/DriverHomeScreen';
import DriverEarningsScreen from '../Screens/DriverEarningsScreen';
import DriverPublishTripModeScreen from '../Screens/DriverPublishTripModeScreen';
import DriverCityPoolVehicleScreen from '../Screens/DriverCityPoolVehicleScreen';
import DriverBikeCreateRideScreen from '../Screens/DriverBikeCreateRideScreen';
import DriverBikePlannedRidesScreen from '../Screens/DriverBikePlannedRidesScreen';
import DriverBikeDropoffSearchScreen from '../Screens/DriverBikeDropoffSearchScreen';
import DriverBikeChooseRouteScreen from '../Screens/DriverBikeChooseRouteScreen';
import DriverBikeCreateRouteScreen from '../Screens/DriverBikeCreateRouteScreen';
import DriverCarCreateRideScreen from '../Screens/DriverCarCreateRideScreen';
import DriverCarPlannedRidesScreen from '../Screens/DriverCarPlannedRidesScreen';
import DriverCarChooseRouteScreen from '../Screens/DriverCarChooseRouteScreen';
import DriverCarCreateRouteScreen from '../Screens/DriverCarCreateRouteScreen';
import DriverPublishCityPoolScreen from '../Screens/DriverPublishCityPoolScreen';
import DriverPublishOutstationPoolScreen from '../Screens/DriverPublishOutstationPoolScreen';
import DriverOutstationBoardingPointsScreen from '../Screens/DriverOutstationBoardingPointsScreen';
import DriverOutstationLocationSearchScreen from '../Screens/DriverOutstationLocationSearchScreen';
import DriverRentalRequestScreen from '../Screens/DriverRentalRequestScreen';
import DriverRentalInProgressScreen from '../Screens/DriverRentalInProgressScreen';
import DriverPublishOutstationRentalScreen from '../Screens/DriverPublishOutstationRentalScreen';
import DriverMyTripsScreen from '../Screens/DriverMyTripsScreen';
import DriverProfileScreen from '../Screens/DriverProfileScreen';
// import DriverProfileMyTripsScreen from '../Screens/DriverProfileMyTripsScreen'; // Dynamically required below
import DriverOnlineScreen from '../Screens/DriverOnlineScreen';
import DriverRideNavigationScreen from '../Screens/DriverRideNavigationScreen';
import DriverChatScreen from '../Screens/DriverChatScreen';
import DriverRideCompletedScreen from '../Screens/DriverRideCompletedScreen';
import DriverRatingScreen from '../Screens/DriverRatingScreen';
import DriverPendingApprovalScreen from '../Screens/DriverPendingApprovalScreen';

import SplashScreen from '../Screens/SplashScreen';
import CashfreeWebPaymentScreen from '../Screens/CashfreeWebPaymentScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    const { user, isAppLoading } = useAuth();

    if (isAppLoading) {
        return <SplashScreen />;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>

                {/* 1. Unauthenticated Stack */}
                {!user ? (
                    <Stack.Group>
                        <Stack.Screen name="Entry" component={EntryScreen} />
                        <Stack.Screen name="UnifiedLogin" component={UnifiedLoginScreen} />
                        <Stack.Screen name="PassengerLogin" component={PassengerLoginScreen} />
                        <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
                        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
                        <Stack.Screen name="DriverRegistration" component={DriverRegistrationScreen} />
                        <Stack.Screen name="DriverDocumentUpload" component={DriverDocumentUploadScreen} />
                        <Stack.Screen name="DriverVehicleSelection" component={DriverVehicleSelectionScreen} />
                        <Stack.Screen name="DriverVehicleDetails" component={DriverVehicleDetailsScreen} />
                    </Stack.Group>
                ) : user.role === 'driver' && user.driverApprovalStatus !== 'approved' ? (
                    /* 2. Driver Pending Verification Stack */
                    <Stack.Group>
                        <Stack.Screen name="DriverPendingApproval" component={DriverPendingApprovalScreen} />
                        <Stack.Screen name="ReuploadRegistration" component={DriverRegistrationScreen} />
                        <Stack.Screen name="ReuploadDocumentUpload" component={DriverDocumentUploadScreen} />
                        <Stack.Screen name="ReuploadVehicleSelection" component={DriverVehicleSelectionScreen} />
                        <Stack.Screen name="ReuploadVehicleDetails" component={DriverVehicleDetailsScreen} />
                    </Stack.Group>
                ) : user.role === 'driver' ? (
                    /* 2. Driver Stack */
                    <Stack.Group>
                        <Stack.Screen name="DriverHome" component={DriverHomeScreen} />
                        <Stack.Screen name="DriverEarnings" component={DriverEarningsScreen} />
                        <Stack.Screen name="DriverPublishTripMode" component={DriverPublishTripModeScreen} />
                        <Stack.Screen name="DriverCityPoolVehicle" component={DriverCityPoolVehicleScreen} />
                        <Stack.Screen name="DriverBikeCreateRide" component={DriverBikeCreateRideScreen} />
                        <Stack.Screen name="DriverBikePlannedRides" component={DriverBikePlannedRidesScreen} />
                        <Stack.Screen name="DriverBikeDropoffSearch" component={DriverBikeDropoffSearchScreen} />
                        <Stack.Screen name="DriverBikeDropoffSearchScreen" component={DriverBikeDropoffSearchScreen} />
                        <Stack.Screen name="DriverBikeChooseRoute" component={DriverBikeChooseRouteScreen} />
                        <Stack.Screen name="DriverBikeCreateRoute" component={DriverBikeCreateRouteScreen} />
                        <Stack.Screen name="DriverCarCreateRide" component={DriverCarCreateRideScreen} />
                        <Stack.Screen name="DriverCarPlannedRides" component={DriverCarPlannedRidesScreen} />
                        <Stack.Screen name="DriverCarChooseRoute" component={DriverCarChooseRouteScreen} />
                        <Stack.Screen name="DriverCarCreateRoute" component={DriverCarCreateRouteScreen} />
                        <Stack.Screen name="DriverPublishCityPool" component={DriverPublishCityPoolScreen} />
                        <Stack.Screen name="DriverPublishOutstationPool" component={DriverPublishOutstationPoolScreen} />
                        <Stack.Screen name="DriverOutstationBoardingPoints" component={DriverOutstationBoardingPointsScreen} />
                        <Stack.Screen name="DriverOutstationLocationSearch" component={DriverOutstationLocationSearchScreen} />
                        <Stack.Screen name="DriverPublishOutstationRental" component={DriverPublishOutstationRentalScreen} />
                        <Stack.Screen name="DriverRentalRequest" component={DriverRentalRequestScreen} />
                        <Stack.Screen name="DriverRentalInProgress" component={DriverRentalInProgressScreen} />
                        <Stack.Screen name="DriverMyTrips" component={DriverMyTripsScreen} />
                        <Stack.Screen name="DriverProfile" component={DriverProfileScreen} />
                        <Stack.Screen name="DriverEditProfile" component={require('../Screens/DriverEditProfileScreen').default} />
                        <Stack.Screen name="DriverBankDetails" component={require('../Screens/DriverBankDetailsScreen').default} />
                        <Stack.Screen name="DriverProfileMyTrips" component={require('../Screens/DriverProfileMyTripsScreen').default} />
                        <Stack.Screen name="DriverOnline" component={DriverOnlineScreen} />
                        <Stack.Screen name="DriverRideNavigation" component={DriverRideNavigationScreen} />
                        <Stack.Screen name="DriverRideCompleted" component={DriverRideCompletedScreen} />
                        <Stack.Screen name="DriverRating" component={DriverRatingScreen} />
                        <Stack.Screen name="DriverChat" component={DriverChatScreen} />
                        <Stack.Screen name="DriverRegistration" component={DriverRegistrationScreen} />
                        <Stack.Screen name="DriverDocumentUpload" component={DriverDocumentUploadScreen} />
                        <Stack.Screen name="DriverVehicleSelection" component={DriverVehicleSelectionScreen} />
                        <Stack.Screen name="DriverVehicleDetails" component={DriverVehicleDetailsScreen} />
                        <Stack.Screen name="DriverPendingApproval" component={DriverPendingApprovalScreen} />
                        {/* Shared/Common screens can be added here if needed by drivers too, e.g. Wallet/Support */}
                        <Stack.Screen name="Wallet" component={WalletScreen} />
                        <Stack.Screen name="Support" component={SupportScreen} />
                        <Stack.Screen name="AppFeedback" component={AppFeedbackScreen} />
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                        <Stack.Screen name="CashfreeWebPayment" component={CashfreeWebPaymentScreen} />
                    </Stack.Group>
                ) : (
                    /* 3. Passenger Stack (Default) */
                    <Stack.Group>
                        <Stack.Screen name="PassengerHome" component={PassengerHomeScreen} />
                        <Stack.Screen name="Wallet" component={WalletScreen} />
                        <Stack.Screen name="Support" component={SupportScreen} />
                        <Stack.Screen name="AppFeedback" component={AppFeedbackScreen} />
                        <Stack.Screen name="PassengerProfile" component={PassengerProfileScreen} />
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                        <Stack.Screen name="Outstation" component={OutstationScreen} />
                        <Stack.Screen name="DropLocation" component={DropLocationScreen} />
                        <Stack.Screen name="RideSelection" component={RideSelectionScreen} />
                        <Stack.Screen name="AvailableRides" component={AvailableRidesScreen} />
                        <Stack.Screen name="SeatPreference" component={SeatPreferenceScreen} />
                        <Stack.Screen name="TripDetails" component={TripDetailsScreen} />
                        <Stack.Screen name="OfferFare" component={OfferFareScreen} />
                        <Stack.Screen name="FindingDriver" component={FindingDriverScreen} />
                        <Stack.Screen name="DriverOffers" component={DriverOffersScreen} />
                        <Stack.Screen name="DriverAccepted" component={DriverAcceptedScreen} />
                        <Stack.Screen name="RideTracking" component={RideTrackingScreen} />
                        <Stack.Screen name="PoolingSuccess" component={PoolingSuccessScreen} />
                        <Stack.Screen name="PassengerMyTrips" component={PassengerMyTripsScreen} />
                        <Stack.Screen name="RideCompleted" component={RideCompletedScreen} />
                        <Stack.Screen name="OutstationReview" component={OutstationReviewScreen} />
                        <Stack.Screen name="OutstationModes" component={OutstationModesScreen} />
                        <Stack.Screen name="OutstationRideDetail" component={OutstationRideDetailScreen} />
                        <Stack.Screen name="OutstationScheduledScreen" component={OutstationScheduledScreen} />
                        <Stack.Screen name="DriverChat" component={DriverChatScreen} />
                        <Stack.Screen name="CashfreeWebPayment" component={CashfreeWebPaymentScreen} />
                    </Stack.Group>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
