import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { supabase, Member, calculateDaysRemaining, getMemberStatus } from '../../lib/supabase';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/colors';
import i18n from '../../i18n';

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { profile, signOut } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    fetchMemberProfile();
  }, []);

  const fetchMemberProfile = async () => {
    try {
      // Get member by email (for members logging in)
      if (profile?.email) {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('email', profile.email)
          .single();

        if (data) {
          setMember(data);
          setDaysRemaining(calculateDaysRemaining(data.end_date));
        }
      }
    } catch (error) {
      console.error('Error fetching member:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!member) return colors.textSecondary;
    const status = getMemberStatus(member.end_date);
    switch (status) {
      case 'active':
        return colors.statusActive;
      case 'expiring_soon':
        return colors.statusExpiringSoon;
      case 'expired':
        return colors.statusExpired;
      default:
        return colors.textSecondary;
    }
  };

  const handleLogout = () => {
    Alert.alert(
      i18n.t('logout'),
      'Are you sure you want to log out?',
      [
        { text: i18n.t('cancel'), style: 'cancel' },
        {
          text: i18n.t('logout'),
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{i18n.t('profile')}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>{i18n.t('logout')}</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.full_name?.charAt(0) || 'M'}
            </Text>
          </View>
        </View>
        <Text style={styles.name}>{profile?.full_name || 'Member'}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
        
        {/* Membership Status */}
        {member && (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>
              {member.status === 'active' ? i18n.t('active') :
               member.status === 'expiring_soon' ? i18n.t('expiring_soon') :
               member.status === 'expired' ? i18n.t('expired') : member.status}
            </Text>
          </View>
        )}
      </View>

      {/* QR Code Section */}
      {member && (
        <View style={styles.qrSection}>
          <Text style={styles.sectionTitle}>Your Access QR Code</Text>
          <Text style={styles.qrDescription}>
            Show this QR code at the entrance for check-in
          </Text>
          <View style={styles.qrContainer}>
            <View style={styles.qrBackground}>
              <QRCode
                value={member.qr_code || member.member_id}
                size={200}
                color={colors.white}
                backgroundColor={colors.background}
              />
            </View>
          </View>
          <Text style={styles.memberIdText}>Member ID: {member.member_id}</Text>
        </View>
      )}

      {/* Membership Details */}
      {member && (
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>{i18n.t('membership_plan')}</Text>
          
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Plan</Text>
              <Text style={styles.detailValue}>{member.membership_plan}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{i18n.t('start_date')}</Text>
              <Text style={styles.detailValue}>
                {new Date(member.start_date).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{i18n.t('end_date')}</Text>
              <Text style={styles.detailValue}>
                {new Date(member.end_date).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{i18n.t('days_remaining')}</Text>
              <Text style={[styles.detailValue, { color: getStatusColor() }]}>
                {daysRemaining} {i18n.t('days_left')}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Countdown Timer */}
      {member && daysRemaining > 0 && daysRemaining <= 30 && (
        <View style={styles.countdownSection}>
          <Text style={styles.countdownTitle}>
            {daysRemaining <= 5 ? '⚠️ Membership Expiring Soon!' : '⏰ Membership Countdown'}
          </Text>
          <View style={styles.countdownContainer}>
            <View style={styles.countdownItem}>
              <Text style={styles.countdownValue}>{daysRemaining}</Text>
              <Text style={styles.countdownLabel}>Days</Text>
            </View>
          </View>
        </View>
      )}

      {/* Contact Info */}
      <View style={styles.contactSection}>
        <Text style={styles.sectionTitle}>{i18n.t('contact_us')}</Text>
        <View style={styles.contactCard}>
          <Text style={styles.contactText}>📞 +243 962 909 624</Text>
          <Text style={styles.contactText}>📞 +243 859 439 292</Text>
          <Text style={styles.contactText}>📧 info@pantherscrossfit.com</Text>
        </View>
      </View>

      {/* Gym Hours */}
      <View style={styles.hoursSection}>
        <Text style={styles.sectionTitle}>{i18n.t('opening_hours')}</Text>
        <View style={styles.hoursCard}>
          <Text style={styles.hoursText}>Mon - Fri: 06:00 - 22:00</Text>
          <Text style={styles.hoursText}>Saturday: 07:00 - 21:30</Text>
          <Text style={styles.hoursText}>Sunday: 07:00 - 12:00</Text>
          <Text style={styles.hoursText}>Holidays: 07:00 - 12:00</Text>
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
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  logoutButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  logoutText: {
    fontSize: fontSize.md,
    color: colors.error,
    fontWeight: fontWeight.medium,
  },
  profileCard: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  qrSection: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  qrDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  qrContainer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  qrBackground: {
    padding: spacing.md,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
  },
  memberIdText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  detailsSection: {
    padding: spacing.lg,
  },
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  countdownSection: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  countdownTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.warning,
    marginBottom: spacing.md,
  },
  countdownContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  countdownItem: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    minWidth: 100,
  },
  countdownValue: {
    fontSize: 48,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  countdownLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  contactSection: {
    padding: spacing.lg,
  },
  contactCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  contactText: {
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  hoursSection: {
    padding: spacing.lg,
  },
  hoursCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  hoursText: {
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
});

export default ProfileScreen;

