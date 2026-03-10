import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { supabase, generateMemberId, generateRandomPassword, calculateEndDate, getMemberStatus } from '../../lib/supabase';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/colors';
import i18n from '../../i18n';

type AddMemberScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const MEMBERSHIP_PLANS = [
  { id: '1m', name: '1 Month without Coach', duration: 30, price: 130 },
  { id: '1m_c', name: '1 Month with Coach', duration: 30, price: 160 },
  { id: '10d', name: '10 Days without Coach', duration: 10, price: 50 },
  { id: '10d_c', name: '10 Days with Coach', duration: 10, price: 60 },
  { id: '1s', name: '1 Session', duration: 1, price: 15 },
  { id: '3m', name: '3 Months without Coach', duration: 90, price: 370 },
  { id: '3m_c', name: '3 Months with Coach', duration: 90, price: 460 },
  { id: '6m', name: '6 Months without Coach', duration: 180, price: 740 },
  { id: '6m_c', name: '6 Months with Coach', duration: 180, price: 920 },
  { id: '1y', name: 'Annual without Coach', duration: 365, price: 1400 },
  { id: '1y_c', name: 'Annual with Coach', duration: 365, price: 1760 },
  { id: 'box_1m', name: 'Boxing 1 Month', duration: 30, price: 90 },
  { id: 'box_3m', name: 'Boxing 3 Months', duration: 90, price: 250 },
  { id: 'box_6m', name: 'Boxing 6 Months', duration: 180, price: 500 },
  { id: 'zumba_1s', name: 'Zumba 1 Session', duration: 1, price: 15 },
  { id: 'zumba_1m', name: 'Zumba 1 Month', duration: 30, price: 100 },
];

const AddMemberScreen: React.FC<AddMemberScreenProps> = ({ navigation }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    notes: '',
    plan_id: '1m',
  });

  const selectedPlan = MEMBERSHIP_PLANS.find(p => p.id === formData.plan_id);

  const handleSubmit = async () => {
    if (!formData.full_name.trim()) {
      Alert.alert(i18n.t('error'), 'Full name is required');
      return;
    }
    if (!formData.phone.trim()) {
      Alert.alert(i18n.t('error'), 'Phone number is required');
      return;
    }

    setLoading(true);
    try {
      // Generate unique member ID and password
      const memberId = generateMemberId();
      const password = generateRandomPassword();
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = calculateEndDate(startDate, selectedPlan?.duration || 30);
      const status = getMemberStatus(endDate);

      // Create auth user
      const email = formData.email.trim() || `${memberId.toLowerCase()}@pantherscrossfit.com`;
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: formData.full_name,
          role: 'member',
          member_id: memberId,
        },
      });

      if (authError) {
        // If user creation fails (maybe email exists), continue with just member record
        console.log('Auth error:', authError.message);
      }

      const userId = authData?.user?.id;

      // Create member record
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .insert({
          member_id: memberId,
          full_name: formData.full_name,
          phone: formData.phone,
          email: email,
          membership_plan: selectedPlan?.name || '1 Month',
          start_date: startDate,
          end_date: endDate,
          status,
          qr_code: memberId,
          notes: formData.notes || null,
          created_by: profile?.id,
        })
        .select()
        .single();

      if (memberError) throw memberError;

      Alert.alert(
        i18n.t('success'),
        `${i18n.t('member_created')}\n\nMember ID: ${memberId}\nPassword: ${password}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating member:', error);
      Alert.alert(i18n.t('error'), error.message || 'Failed to create member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{i18n.t('add_member')}</Text>
        <Text style={styles.subtitle}>Create a new member account</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        {/* Full Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{i18n.t('full_name')} *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter full name"
            placeholderTextColor={colors.textMuted}
            value={formData.full_name}
            onChangeText={(text) => setFormData({ ...formData, full_name: text })}
            editable={!loading}
          />
        </View>

        {/* Phone */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{i18n.t('phone')} *</Text>
          <TextInput
            style={styles.input}
            placeholder="+243 962 909 624"
            placeholderTextColor={colors.textMuted}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
            editable={!loading}
          />
        </View>

        {/* Email (Optional) */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{i18n.t('email')} (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="member@email.com"
            placeholderTextColor={colors.textMuted}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        {/* Membership Plan */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{i18n.t('membership_plan')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.planScroll}>
            {MEMBERSHIP_PLANS.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planOption,
                  formData.plan_id === plan.id && styles.planOptionSelected,
                ]}
                onPress={() => setFormData({ ...formData, plan_id: plan.id })}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.planName,
                    formData.plan_id === plan.id && styles.planNameSelected,
                  ]}
                >
                  {plan.name}
                </Text>
                <Text
                  style={[
                    styles.planPrice,
                    formData.plan_id === plan.id && styles.planPriceSelected,
                  ]}
                >
                  ${plan.price}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Notes */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{i18n.t('notes')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add any notes..."
            placeholderTextColor={colors.textMuted}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            multiline
            numberOfLines={3}
            editable={!loading}
          />
        </View>

        {/* Selected Plan Info */}
        {selectedPlan && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Membership Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Plan:</Text>
              <Text style={styles.summaryValue}>{selectedPlan.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration:</Text>
              <Text style={styles.summaryValue}>{selectedPlan.duration} days</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Price:</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                ${selectedPlan.price}
              </Text>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>{i18n.t('submit')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  form: {},
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  planScroll: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  planOption: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 140,
  },
  planOptionSelected: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primary,
  },
  planName: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  planNameSelected: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  planPrice: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
  },
  planPriceSelected: {
    color: colors.white,
  },
  summaryCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});

export default AddMemberScreen;

