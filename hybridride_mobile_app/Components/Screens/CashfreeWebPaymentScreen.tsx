import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    Alert,
    SafeAreaView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';

/**
 * CashfreeWebPaymentScreen
 *
 * Uses Cashfree JS SDK inside a WebView — completely bypasses the native
 * SDK's INSTALLER_PACKAGE_NOT_APPROVED / NOT_AVAILABLE check that fires
 * when the APK is sideloaded via ADB instead of installed from Play Store.
 *
 * Navigation params:
 *  - paymentSessionId: string   (from backend createCashfreeOrder)
 *  - orderId: string
 *  - environment: 'SANDBOX' | 'PRODUCTION'
 *  - onSuccess: (orderId: string) => void   (called when payment verified)
 *  - onError:   (message: string) => void   (called on failure/cancel)
 */
const CashfreeWebPaymentScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { paymentSessionId, orderId, environment, onSuccess, onError } = route.params || {};

    const webViewRef = useRef<any>(null);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState(false);
    const handledRef = useRef(false); // prevent double-call

    const cfMode = (environment === 'PRODUCTION') ? 'production' : 'sandbox';

    // Inline HTML that loads Cashfree JS SDK and triggers checkout
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#f0f2f5; display:flex; align-items:center; justify-content:center; min-height:100vh; font-family:sans-serif; }
    #msg { text-align:center; color:#666; font-size:14px; padding:20px; }
  </style>
</head>
<body>
  <div id="msg">Initializing payment...</div>
  <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
  <script>
    (function() {
      try {
        const cashfree = Cashfree({ mode: "${cfMode}" });
        const checkoutOptions = {
          paymentSessionId: "${paymentSessionId}",
          redirectTarget: "_self",
        };
        document.getElementById('msg').innerText = 'Opening payment...';
        cashfree.checkout(checkoutOptions).then(function(result) {
          if (result.error) {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'ERROR',
              message: result.error.message || 'Payment failed',
              code: result.error.code || 'unknown'
            }));
          }
          if (result.paymentDetails) {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'SUCCESS',
              orderId: "${orderId}"
            }));
          }
        }).catch(function(err) {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'ERROR',
            message: err.message || 'Unexpected error',
            code: 'js_error'
          }));
        });
      } catch(e) {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'ERROR',
          message: e.message || 'Init error',
          code: 'init_error'
        }));
      }
    })();
  </script>
</body>
</html>
`;

    const handleMessage = (event: any) => {
        if (handledRef.current) return;
        try {
            const data = JSON.parse(event.nativeEvent.data);
            console.log('[CashfreeWebPayment] message:', data);

            if (data.type === 'SUCCESS') {
                handledRef.current = true;
                navigation.goBack();
                onSuccess && onSuccess(data.orderId || orderId);
            } else if (data.type === 'ERROR') {
                const msg = data.message || 'Payment failed';
                if (msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('user')) {
                    // User cancelled — silently go back
                    handledRef.current = true;
                    navigation.goBack();
                    onError && onError('cancelled');
                } else {
                    handledRef.current = true;
                    navigation.goBack();
                    onError && onError(msg);
                }
            }
        } catch (e) {
            console.log('[CashfreeWebPayment] raw message:', event.nativeEvent.data);
        }
    };

    // Intercept return_url navigation (Cashfree redirects after payment)
    const handleNavigationChange = (navState: any) => {
        const url: string = navState.url || '';
        console.log('[CashfreeWebPayment] navigating to:', url);

        if (handledRef.current) return;

        // Cashfree return URL contains order_id param → payment done
        if (url.includes('/cashfree/return') || url.includes('order_id=')) {
            handledRef.current = true;
            navigation.goBack();
            onSuccess && onSuccess(orderId);
        }
    };

    const handleCancel = () => {
        Alert.alert('Cancel Payment', 'Are you sure you want to cancel?', [
            { text: 'No', style: 'cancel' },
            {
                text: 'Yes, Cancel',
                style: 'destructive',
                onPress: () => {
                    navigation.goBack();
                    onError && onError('cancelled');
                },
            },
        ]);
    };

    if (!paymentSessionId || !orderId) {
        return (
            <SafeAreaView style={styles.centered}>
                <Text style={styles.errorText}>Invalid payment session. Please try again.</Text>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
                    <Text style={styles.cancelText}>✕ Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Secure Payment</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Loading overlay */}
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#6C63FF" />
                    <Text style={styles.loadingText}>Loading Cashfree...</Text>
                </View>
            )}

            {/* Error state */}
            {pageError && (
                <View style={styles.centered}>
                    <Text style={styles.errorText}>Failed to load payment page.</Text>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => {
                            setPageError(false);
                            setLoading(true);
                            webViewRef.current?.reload();
                        }}>
                        <Text style={styles.backBtnText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Cashfree JS SDK WebView */}
            {!pageError && (
                <WebView
                    ref={webViewRef}
                    source={{ html, baseUrl: 'https://sdk.cashfree.com' }}
                    onLoadEnd={() => setLoading(false)}
                    onError={() => { setLoading(false); setPageError(true); }}
                    onMessage={handleMessage}
                    onNavigationStateChange={handleNavigationChange}
                    javaScriptEnabled
                    domStorageEnabled
                    thirdPartyCookiesEnabled
                    mixedContentMode="always"
                    style={styles.webview}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        elevation: 2,
    },
    headerTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
    cancelBtn: { padding: 4 },
    cancelText: { color: '#e74c3c', fontSize: 14, fontWeight: '600' },
    placeholder: { width: 60 },
    webview: { flex: 1 },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.95)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    loadingText: { marginTop: 12, color: '#666', fontSize: 14 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    errorText: { color: '#666', fontSize: 15, textAlign: 'center', marginBottom: 20 },
    backBtn: {
        backgroundColor: '#6C63FF',
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});

export default CashfreeWebPaymentScreen;
