import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInUp, SlideInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { useThemeColors } from '../../../hooks/useThemeColors';
import { useHaptics } from '../../../hooks/useHaptics';
import { ProfessionalCard } from '../../../components/ui/ProfessionalCard';
import { ProfessionalButton } from '../../../components/ui/ProfessionalButton';
import { ProfessionalInput } from '../../../components/ui/ProfessionalInput';

export default function ContactSupportScreen() {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const colors = useThemeColors();
  const haptics = useHaptics();
  const router = useRouter();

  const handleSend = () => {
    haptics.impactMedium();
    if (!subject || !message) {
      Alert.alert('Details Required', 'Please provide both a subject and a description of your inquiry.');
      return;
    }
    setSending(true);
    
    // Simulating secure submission
    setTimeout(() => {
      setSending(false);
      haptics.notificationSuccess();
      Alert.alert('Inquiry Submitted', 'Your ticket has been prioritized. A support specialist will contact you within 2-4 hours.', [
        { text: 'Acknowledge', onPress: () => {
          setMessage('');
          router.back();
        }}
      ]);
    }, 1500);
  };

  const openChannel = (type: 'call' | 'wa' | 'mail') => {
    haptics.impactLight();
    let url = '';
    if (type === 'call') url = 'tel:+919876543210';
    if (type === 'wa') url = 'https://wa.me/919876543210';
    if (type === 'mail') url = 'mailto:concierge@parkeasy.com';
    Linking.openURL(url);
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
               <Text style={[styles.headerLabel, { color: colors.textMuted }]}>SUPPORT • ASSISTANCE</Text>
               <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Connect with Us</Text>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
               <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
               <Text style={[styles.statusText, { color: colors.success }]}>ONLINE</Text>
            </View>
          </View>
        </BlurView>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.heroSection}>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Help is on the way.</Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>Our concierge team is available across multiple channels to ensure your experience remains seamless.</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.channelsGrid}>
           {[
             { id: 'call', icon: 'call-outline', label: 'Support Line', color: '#007AFF' },
             { id: 'wa', icon: 'logo-whatsapp', label: 'Live Chat', color: '#34C759' },
             { id: 'mail', icon: 'mail-outline', label: 'Email', color: '#FF9500' }
           ].map((ch) => (
             <TouchableOpacity key={ch.id} onPress={() => openChannel(ch.id as any)} activeOpacity={0.8} style={styles.channelItem}>
                <ProfessionalCard style={styles.channelCard} hasVibrancy={true}>
                   <View style={[styles.channelIconBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Ionicons name={ch.icon as any} size={22} color={ch.color} />
                   </View>
                   <Text style={[styles.channelTitle, { color: colors.textPrimary }]}>{ch.label}</Text>
                </ProfessionalCard>
             </TouchableOpacity>
           ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
           <ProfessionalCard style={styles.formCard}>
              <View style={styles.formHeader}>
                 <Ionicons name="chatbox-ellipses-outline" size={20} color={colors.primary} />
                 <Text style={[styles.formLabel, { color: colors.textMuted }]}>ENCRYPTED MESSAGE</Text>
              </View>

              <ProfessionalInput
                 label="Subject"
                 value={subject}
                 onChangeText={setSubject}
                 placeholder="What can we help you with?"
                 icon="information-circle-outline"
              />

              <ProfessionalInput
                 label="Message Details"
                 value={message}
                 onChangeText={setMessage}
                 placeholder="Provide as much detail as possible..."
                 icon="document-text-outline"
                 multiline
              />

              <ProfessionalButton
                 label="Send Secure Message"
                 onPress={handleSend}
                 variant="primary"
                 loading={sending}
                 style={{ marginTop: 12 }}
              />
           </ProfessionalCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.footerInfo}>
           <Text style={[styles.footerText, { color: colors.textMuted }]}>
             Support requests are typically resolved within 2-4 business hours. For urgent facility access issues, please use the Voice channel.
           </Text>
        </Animated.View>
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
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  scrollContent: { padding: 24, paddingBottom: 60 },
  heroSection: { marginBottom: 32, paddingHorizontal: 4 },
  heroTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  heroSub: { fontSize: 15, marginTop: 8, lineHeight: 22, fontWeight: '600' },
  channelsGrid: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  channelItem: { flex: 1 },
  channelCard: { alignItems: 'center', padding: 16, borderRadius: 24 },
  channelIconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, marginBottom: 12 },
  channelTitle: { fontSize: 11, fontWeight: '900', letterSpacing: -0.2 },
  formCard: { padding: 32, borderRadius: 40 },
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 32 },
  formLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  footerInfo: { marginTop: 32, paddingHorizontal: 16 },
  footerText: { fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 18, opacity: 0.8 },
});
