import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  Linking,
} from 'react-native';

export default function HelpSupportScreen({ navigation }) {
  const handleContactSupport = () => {
    Linking.openURL('mailto:support@helloflick.com?subject=Flick Support Request');
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://helloflick.com/privacy.html');
  };

  const handleTermsOfService = () => {
    Linking.openURL('https://helloflick.com/terms.html');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* FAQ Section */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

        <View style={styles.faqCard}>
          <Text style={styles.faqQuestion}>How does Flick work?</Text>
          <Text style={styles.faqAnswer}>
            Flick helps you meet people at events. Scan the event QR code, create your profile, and browse others within 500 meters. Flick someone to show interest!
          </Text>
        </View>

        <View style={styles.faqCard}>
          <Text style={styles.faqQuestion}>How do I match with someone?</Text>
          <Text style={styles.faqAnswer}>
            When you flick someone and they flick you back, it's a match! You'll both see a green light and can start chatting.
          </Text>
        </View>

        <View style={styles.faqCard}>
          <Text style={styles.faqQuestion}>Is my location shared with others?</Text>
          <Text style={styles.faqAnswer}>
            No. We only show approximate distance ("45m away"). Your exact GPS coordinates are never visible to other users.
          </Text>
        </View>

        <View style={styles.faqCard}>
          <Text style={styles.faqQuestion}>How do I delete my profile?</Text>
          <Text style={styles.faqAnswer}>
            Go to Profile → Delete Account. Your data will be permanently removed and cannot be recovered.
          </Text>
        </View>

        <View style={styles.faqCard}>
          <Text style={styles.faqQuestion}>What happens when I leave the event?</Text>
          <Text style={styles.faqAnswer}>
            Your profile stays active until you sign out or delete your account. Matches dissolve when you're more than 500m apart.
          </Text>
        </View>

        {/* Contact Section */}
        <Text style={styles.sectionTitle}>Need More Help?</Text>

        <TouchableOpacity style={styles.menuCard} onPress={handleContactSupport}>
          <View style={styles.menuItem}>
            <Text style={styles.menuIcon}>✉️</Text>
            <Text style={styles.menuText}>Contact Support</Text>
            <Text style={styles.menuChevron}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Legal Section */}
        <Text style={styles.sectionTitle}>Legal</Text>

        <TouchableOpacity style={styles.menuCard} onPress={handlePrivacyPolicy}>
          <View style={styles.menuItem}>
            <Text style={styles.menuIcon}>🔒</Text>
            <Text style={styles.menuText}>Privacy Policy</Text>
            <Text style={styles.menuChevron}>›</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuCard} onPress={handleTermsOfService}>
          <View style={styles.menuItem}>
            <Text style={styles.menuIcon}>📄</Text>
            <Text style={styles.menuText}>Terms of Service</Text>
            <Text style={styles.menuChevron}>›</Text>
          </View>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Flick v1.0.0</Text>
          <Text style={styles.appTagline}>Turn a Look into Hello</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 32,
    color: '#000000',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
    marginTop: 8,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIcon: {
    fontSize: 18,
    width: 30,
    textAlign: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    marginLeft: 8,
  },
  menuChevron: {
    fontSize: 20,
    color: '#CCCCCC',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 32,
    paddingVertical: 24,
  },
  appVersion: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 12,
    color: '#C44CE0',
    fontStyle: 'italic',
  },
});
