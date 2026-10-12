import { View, StyleSheet } from 'react-native';
import { BannerAd as GoogleBannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

const BANNER_ID = 'ca-app-pub-3309697276277935/3471239046';

export function BannerAd() {
  return (
    <View style={styles.container}>
      <GoogleBannerAd
        unitId={BANNER_ID}
        size={BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', alignItems: 'center', paddingVertical: 4 },
});
