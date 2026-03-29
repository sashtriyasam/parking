import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/Toast';

export default function ContactSupportScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  });

  const handleSubmit = async () => {
    if (!formData.subject || !formData.message) {
      showToast('Please fill in both subject and message.', 'error');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      showToast('Support ticket raised. We will get back to you shortly.', 'success');
      router.back();
    }, 1500);
  };

  const openWhatsApp = () => {
    Linking.openURL('whatsapp://send?phone=+911234567890&text=Hi ParkEasy Support, I need help with...');
  };

  const openCall = () => {
    Linking.openURL('tel:+911234567890');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Contact Support</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Get in Touch</Text>
          <Text style={styles.introSubtitle}>Choose your preferred way to connect with our support team.</Text>
        </View>

        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactCard} onPress={openWhatsApp}>
            <View style={[styles.iconBox, { backgroundColor: '#25D366' }]}>
              <Ionicons name="logo-whatsapp" size={24} color="white" />
            </View>
            <Text style={styles.contactLabel}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={openCall}>
            <View style={[styles.iconBox, { backgroundColor: colors.primary }]}>
              <Ionicons name="call" size={24} color="white" />
            </View>
            <Text style={styles.contactLabel}>Call Us</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={() => Linking.openURL('mailto:support@parkeasy.com')}>
            <View style={[styles.iconBox, { backgroundColor: '#EA4335' }]}>
              <Ionicons name="mail" size={24} color="white" />
            </View>
            <Text style={styles.contactLabel}>Email</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Raise a Ticket</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={styles.input}
              value={formData.subject}
              onChangeText={(text) => setFormData(p => ({...p, subject: text}))}
              placeholder="e.g. Payment Issue, Booking Not Found"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.message}
              onChangeText={(text) => setFormData(p => ({...p, message: text}))}
              placeholder="Describe your issue in detail..."
              multiline
              numberOfLines={5}
            />
          </View>

          <Button 
            label="Submit Ticket" 
            onPress={handleSubmit} 
            loading={loading}
            style={{ marginTop: 10 }}
          />
        </View>
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
  introSection: {
    marginBottom: 32,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  contactCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  formContainer: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 40,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  }
});
