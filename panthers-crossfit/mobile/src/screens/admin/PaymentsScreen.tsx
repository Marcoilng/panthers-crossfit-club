import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { supabase, Payment, Member } from '../../lib/supabase';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/colors';
import i18n from '../../i18n';

type PaymentsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const PaymentsScreen: React.FC<PaymentsScreenProps> = ({ navigation }) => {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [members, setMembers] = useState<{ id: string; full_name: string; member_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch members for reference
      const { data: membersData } = await supabase
        .from('members')
        .select('id, full_name, member_id')
        .order('full_name');

      setPayments(paymentsData || []);
      setMembers(membersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleAddPayment = async () => {
    if (!selectedMember || !amount) {
      Alert.alert(i18n.t('error'), 'Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('payments')
        .insert({
          member_id: selectedMember,
          amount: parseFloat(amount),
          payment_date: today,
          payment_method: paymentMethod,
          created_by: profile?.id,
        });

      if (error) throw error;

      Alert.alert(i18n.t('success'), i18n.t('payment_success'));
      setShowAddForm(false);
      setSelectedMember('');
      setAmount('');
      fetchData();
    } catch (error: any) {
      Alert.alert(i18n.t('error'), error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member?.full_name || 'Unknown';
  };

  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const monthlyRevenue = payments
    .filter(p => {
      const paymentDate = new Date(p.payment_date);
      const now = new Date();
      return paymentDate.getMonth() === now.getMonth() && 
             paymentDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const renderPaymentItem = ({ item }: { item: Payment }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentInfo}>
        <Text style={styles.memberName}>{getMemberName(item.member_id)}</Text>
        <Text style={styles.paymentDate}>
          {new Date(item.payment_date).toLocaleDateString()}
        </Text>
        <Text style={styles.paymentMethod}>{item.payment_method}</Text>
      </View>
      <View style={styles.paymentAmount}>
        <Text style={styles.amountText}>${item.amount?.toFixed(2)}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{i18n.t('payments')}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Revenue</Text>
          <Text style={styles.statValue}>${totalRevenue.toFixed(2)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>This Month</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            ${monthlyRevenue.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Add Payment Form */}
      {showAddForm && (
        <View style={styles.addForm}>
          <Text style={styles.formTitle}>{i18n.t('add_payment')}</Text>
          
          <TextInput
            style={styles.select}
            placeholder="Select member"
            placeholderTextColor={colors.textMuted}
            value={selectedMember}
            onChangeText={setSelectedMember}
          />

          <TextInput
            style={styles.input}
            placeholder={i18n.t('amount')}
            placeholderTextColor={colors.textMuted}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />

          <View style={styles.methodButtons}>
            {['cash', 'card', 'mobile_money', 'bank_transfer'].map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.methodButton,
                  paymentMethod === method && styles.methodButtonActive,
                ]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text style={[
                  styles.methodButtonText,
                  paymentMethod === method && styles.methodButtonTextActive,
                ]}>
                  {method.replace('_', ' ').toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleAddPayment}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>{i18n.t('submit')}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Payments List */}
      <FlatList
        data={payments}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{i18n.t('no_data')}</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: fontSize.xxl,
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  addForm: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    marginTop: 0,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  formTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  select: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  methodButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  methodButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundLight,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  methodButtonActive: {
    backgroundColor: colors.primary,
  },
  methodButtonText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  methodButtonTextActive: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  paymentCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  paymentDate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  paymentMethod: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  paymentAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});

export default PaymentsScreen;

