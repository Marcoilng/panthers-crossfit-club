import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { supabase, Member, Payment, CheckIn } from '../../lib/supabase';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/colors';
import i18n from '../../i18n';

type AdminDashboardScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

interface Stats {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  expiringSoonMembers: number;
  todayCheckIns: number;
  monthlyRevenue: number;
  annualRevenue: number;
}

const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ navigation }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalMembers: 0,
    activeMembers: 0,
    expiredMembers: 0,
    expiringSoonMembers: 0,
    todayCheckIns: 0,
    monthlyRevenue: 0,
    annualRevenue: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get all members
      const { data: members } = await supabase
        .from('members')
        .select('*');

      if (members) {
        const today = new Date().toISOString().split('T')[0];
        const fiveDaysFromNow = new Date();
        fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
        const fiveDaysStr = fiveDaysFromNow.toISOString().split('T')[0];

        const activeMembers = members.filter(m => {
          const daysRemaining = Math.ceil((new Date(m.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return daysRemaining > 0 && daysRemaining > 5;
        }).length;

        const expiredMembers = members.filter(m => {
          const daysRemaining = Math.ceil((new Date(m.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return daysRemaining <= 0;
        }).length;

        const expiringSoonMembers = members.filter(m => {
          const endDate = m.end_date;
          return endDate >= today && endDate <= fiveDaysStr;
        }).length;

        // Get today's check-ins
        const { data: todayCheckIns } = await supabase
          .from('checkins')
          .select('*')
          .eq('check_in_date', today);

        // Get monthly revenue
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        const { data: monthlyPayments } = await supabase
          .from('payments')
          .select('amount')
          .gte('payment_date', firstDayOfMonth.toISOString().split('T')[0]);

        // Get annual revenue
        const firstDayOfYear = new Date();
        firstDayOfYear.setMonth(0, 1);
        const { data: annualPayments } = await supabase
          .from('payments')
          .select('amount')
          .gte('payment_date', firstDayOfYear.toISOString().split('T')[0]);

        setStats({
          totalMembers: members.length,
          activeMembers,
          expiredMembers,
          expiringSoonMembers,
          todayCheckIns: todayCheckIns?.length || 0,
          monthlyRevenue: monthlyPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
          annualRevenue: annualPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const StatCard = ({ title, value, color, icon, onPress }: any) => (
    <TouchableOpacity 
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.statHeader}>
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{i18n.t('welcome_back')}!</Text>
          <Text style={styles.adminName}>{profile?.full_name || 'Admin'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.profileInitial}>
            {profile?.full_name?.charAt(0) || 'A'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dashboard Title */}
      <Text style={styles.dashboardTitle}>{i18n.t('dashboard')}</Text>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title={i18n.t('total_members')}
          value={stats.totalMembers}
          color={colors.primary}
          icon="👥"
          onPress={() => navigation.navigate('Members')}
        />
        <StatCard
          title={i18n.t('active_members')}
          value={stats.activeMembers}
          color={colors.statusActive}
          icon="✅"
        />
        <StatCard
          title={i18n.t('expired_members')}
          value={stats.expiredMembers}
          color={colors.statusExpired}
          icon="❌"
        />
        <StatCard
          title={i18n.t('expiring_soon')}
          value={stats.expiringSoonMembers}
          color={colors.statusExpiringSoon}
          icon="⚠️"
        />
      </View>

      {/* Today's Check-ins */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{i18n.t('today_checkins')}</Text>
        <View style={styles.checkInCard}>
          <Text style={styles.checkInIcon}>🏋️</Text>
          <Text style={styles.checkInValue}>{stats.todayCheckIns}</Text>
          <Text style={styles.checkInLabel}>{i18n.t('today_checkins')}</Text>
        </View>
      </View>

      {/* Revenue Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{i18n.t('revenue_trends')}</Text>
        <View style={styles.revenueContainer}>
          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>{i18n.t('monthly_revenue')}</Text>
            <Text style={styles.revenueValue}>${stats.monthlyRevenue.toLocaleString()}</Text>
          </View>
          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>{i18n.t('annual_revenue')}</Text>
            <Text style={styles.revenueValue}>${stats.annualRevenue.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddMember')}
          >
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionText}>{i18n.t('add_member')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Scanner')}
          >
            <Text style={styles.actionIcon}>📷</Text>
            <Text style={styles.actionText}>{i18n.t('scan_qr_code')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Payments')}
          >
            <Text style={styles.actionIcon}>💰</Text>
            <Text style={styles.actionText}>{i18n.t('payments')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom padding */}
      <View style={styles.bottomPadding} />
    </ScrollView>
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
  greeting: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  adminName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  dashboardTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statIcon: {
    fontSize: fontSize.lg,
    marginRight: spacing.xs,
  },
  statTitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  checkInCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  checkInIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  checkInValue: {
    fontSize: 48,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  checkInLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  revenueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  revenueCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  revenueValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  actionText: {
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: 'center',
  },
  bottomPadding: {
    height: spacing.xxl,
  },
});

export default AdminDashboardScreen;

