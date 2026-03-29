import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS = [
  {
    id: 1,
    question: 'How do I book a parking slot?',
    answer: 'Simply search for your destination on the home map, select a facility, choose your vehicle, and tap "Confirm Booking". Your slot will be reserved instantly.'
  },
  {
    id: 2,
    question: 'How do I pay for my parking?',
    answer: 'We support multiple payment methods including UPI, Credit/Debit cards, and Net Banking via Razorpay. Payment is usually settled upon check-out.'
  },
  {
    id: 3,
    question: 'Can I cancel my booking?',
    answer: 'Yes, you can cancel your booking from the "My Bookings" screen. Cancellations within 10 minutes are usually free of charge.'
  },
  {
    id: 4,
    question: 'How do I find my assigned slot?',
    answer: 'Once you reach the facility, show your QR code to the provider or check the "Active Booking" details for the specific slot number (e.g., A-12).'
  },
  {
    id: 5,
    question: 'Is my vehicle safe?',
    answer: 'All ParkEasy verified facilities are equipped with CCTV and have 24/7 security personnel. However, please do not leave valuables inside the vehicle.'
  }
];

function FAQItem({ item }: { item: typeof FAQS[0] }) {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <TouchableOpacity 
      style={[styles.faqItem, expanded && styles.faqItemExpanded]} 
      onPress={toggle} 
      activeOpacity={0.7}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.questionText}>{item.question}</Text>
        <Ionicons 
          name={expanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={expanded ? colors.primary : colors.textMuted} 
        />
      </View>
      {expanded && (
        <View style={styles.faqBody}>
          <Text style={styles.answerText}>{item.answer}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function FAQScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Frequently Asked Questions</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.helpCard}>
          <Ionicons name="help-circle" size={48} color={colors.primary} />
          <Text style={styles.helpTitle}>How can we help you?</Text>
          <Text style={styles.helpSubtitle}>Search for common queries or contact our support team below.</Text>
        </View>

        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>General Support</Text>
          {FAQS.map(item => (
            <FAQItem key={item.id} item={item} />
          ))}
        </View>

        <TouchableOpacity 
          style={styles.contactCard} 
          onPress={() => router.push('/support/contact')}
        >
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Still have questions?</Text>
            <Text style={styles.contactSubtitle}>Our support team is available 24/7.</Text>
          </View>
          <View style={styles.contactBtn}>
            <Text style={styles.contactBtnText}>Contact Us</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  content: {
    padding: 24,
  },
  helpCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  helpTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  helpSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  faqSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
    paddingLeft: 4,
  },
  faqItem: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  faqItemExpanded: {
    borderColor: colors.primary + '40',
    backgroundColor: colors.surface,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    paddingRight: 16,
  },
  faqBody: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  answerText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  contactCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 40,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  contactBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  contactBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  }
});
