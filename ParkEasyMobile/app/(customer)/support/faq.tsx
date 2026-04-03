import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, SlideInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { useThemeColors } from '../../../hooks/useThemeColors';
import { useHaptics } from '../../../hooks/useHaptics';
import { ProfessionalCard } from '../../../components/ui/ProfessionalCard';
import { ProfessionalButton } from '../../../components/ui/ProfessionalButton';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS = [
  {
    category: 'Reservations & Payments',
    questions: [
      { q: 'How do I secure a parking slot?', a: 'Locate your preferred facility via the discovery map or search bar, select your vehicle classification, and confirm your booking. Your digital ticket will be generated instantly.' },
      { q: 'What is the "Express Exit" feature?', a: 'Express Exit allows for frictionless parking. Enter freely; our system records your arrival. Upon exit, scan your QR at the station, and the final fee is calculated based on exact duration.' },
      { q: 'Are my transactions encrypted?', a: 'Absolutely. All financial transactions are tokenized and processed via PCI-DSS compliant gateways, ensuring your sensitive data never touches our servers.' }
    ]
  },
  {
    category: 'Arrival & Access',
    questions: [
      { q: 'How do I authenticate at the facility?', a: 'Present your "Digital Ticket" QR code located in the Tickets tab to the attendant or automated scanner at the entrance. This initializes your session.' },
      { q: 'Can I extend my stay indefinitely?', a: 'Yes. For most bookings, you are billed for the actual time spent. Your session remains active until your exit QR is successfully validated.' }
    ]
  },
  {
    category: 'Account & Support',
    questions: [
      { q: 'The scanner is failing to read my QR.', a: 'Please ensure your display brightness is optimized. In cases of hardware failure, attendants can manually validate your session using your vehicle registration number.' },
      { q: 'What is the cancellation policy?', a: 'Bookings that have not yet been initialized (scanned at entry) will expire automatically without charge. Active sessions cannot be cancelled.' }
    ]
  }
];

export default function FAQScreen() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const colors = useThemeColors();
  const haptics = useHaptics();
  const router = useRouter();

  const toggleExpand = (id: string) => {
    haptics.impactLight();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />

      <Animated.View entering={SlideInUp.duration(600)} style={styles.header}>
        <BlurView intensity={20} tint={colors.isDark ? 'dark' : 'light'} style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            
            <View style={styles.headerTitleBox}>
               <Text style={[styles.headerLabel, { color: colors.textMuted }]}>SUPPORT • RESOURCES</Text>
               <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Help Center</Text>
            </View>

            <TouchableOpacity style={styles.helpBtn} onPress={() => router.push('/(customer)/support/contact')}>
               <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Common Questions</Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>Find instant answers to the most common queries regarding our premium parking ecosystem.</Text>
        </View>

        {FAQS.map((section, sIndex) => (
          <Animated.View key={sIndex} entering={FadeInDown.delay(200 + sIndex * 100).duration(600)} style={styles.section}>
            <Text style={[styles.categoryLabel, { color: colors.textMuted }]}>{section.category.toUpperCase()}</Text>
            {section.questions.map((item, qIndex) => {
              const id = `${sIndex}-${qIndex}`;
              const isExpanded = expandedId === id;
              return (
                <TouchableOpacity 
                  key={id} 
                  onPress={() => toggleExpand(id)}
                  activeOpacity={0.9}
                >
                  <ProfessionalCard 
                    style={[styles.faqCard, isExpanded && { borderColor: colors.primary + '40' }]} 
                    hasVibrancy={isExpanded}
                  >
                    <View style={styles.qRow}>
                      <Text style={[styles.questionText, { color: colors.textPrimary }]}>{item.q}</Text>
                      <View style={[styles.chevronWrapper, { backgroundColor: isExpanded ? colors.primary + '10' : colors.surface }]}>
                         <Ionicons 
                           name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                           size={16} 
                           color={isExpanded ? colors.primary : colors.textMuted} 
                         />
                      </View>
                    </View>
                    {isExpanded && (
                      <View style={[styles.aRow, { borderTopColor: colors.border }]}>
                        <Text style={[styles.answerText, { color: colors.textSecondary }]}>{item.a}</Text>
                      </View>
                    )}
                  </ProfessionalCard>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        ))}

        <Animated.View entering={FadeInDown.delay(600).duration(600)}>
          <ProfessionalCard style={styles.contactCard} hasVibrancy={true}>
            <View style={[styles.contactIconBox, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="headset-outline" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.contactTitle, { color: colors.textPrimary }]}>Still need assistance?</Text>
            <Text style={[styles.contactSub, { color: colors.textSecondary }]}>Our dedicated concierge team is available 24/7 to resolve any potential issues.</Text>
            
            <ProfessionalButton
               label="Contact Support"
               onPress={() => router.push('/(customer)/support/contact')}
               variant="primary"
               style={{ width: '100%' }}
            />
          </ProfessionalCard>
        </Animated.View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { zIndex: 100 },
  headerContent: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 20,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, gap: 12 },
  navBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  headerTitleBox: { flex: 1 },
  headerLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  helpBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 24, paddingBottom: 60 },
  heroSection: { marginBottom: 40, paddingHorizontal: 4 },
  heroTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  heroSub: { fontSize: 15, marginTop: 8, lineHeight: 22, fontWeight: '600' },
  section: { marginBottom: 32 },
  categoryLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 16, marginLeft: 4 },
  faqCard: { padding: 20, borderRadius: 28, marginBottom: 12 },
  qRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  questionText: { flex: 1, fontSize: 16, fontWeight: '700', marginRight: 16, lineHeight: 22 },
  chevronWrapper: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  aRow: { marginTop: 16, paddingTop: 16, borderTopWidth: 0.5 },
  answerText: { fontSize: 14, lineHeight: 22, fontWeight: '600' },
  contactCard: { marginTop: 20, padding: 32, alignItems: 'center', borderRadius: 40 },
  contactIconBox: { width: 72, height: 72, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  contactTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5, marginBottom: 8 },
  contactSub: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 28, fontWeight: '600' },
});
