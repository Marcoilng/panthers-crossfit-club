import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase, Member, CheckIn, getMemberStatus, calculateDaysRemaining } from '../../lib/supabase';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/colors';
import i18n from '../../i18n';

type ScannerScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

const ScannerScreen: React.FC<ScannerScreenProps> = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastScannedMember, setLastScannedMember] = useState<Member | null>(null);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || loading) return;
    
    setScanned(true);
    setLoading(true);
    
    try {
      // Look up member by QR code (member_id)
      const { data: member, error } = await supabase
        .from('members')
        .select('*')
        .eq('qr_code', data)
        .single();

      if (error || !member) {
        // Member not found
        Alert.alert(
          i18n.t('member_not_found'),
          'No member found with this QR code.',
          [
            {
              text: 'Scan Again',
              onPress: () => setScanned(false),
            },
          ]
        );
        setLoading(false);
        return;
      }

      const status = getMemberStatus(member.end_date);
      const daysRemaining = calculateDaysRemaining(member.end_date);

      // Log check-in
      const today = new Date();
      const checkInDate = today.toISOString().split('T')[0];
      const checkInTime = today.toTimeString().split(' ')[0].substring(0, 5);

      const { error: checkInError } = await supabase
        .from('checkins')
        .insert({
          member_id: member.id,
          member_name: member.full_name,
          check_in_date: checkInDate,
          check_in_time: checkInTime,
        });

      if (checkInError) {
        console.error('Check-in error:', checkInError);
      }

      setLastScannedMember(member);

      // Show result based on status
      if (status === 'expired') {
        Alert.alert(
          i18n.t('access_denied'),
          `${i18n.t('membership_expired')}\n\nMember: ${member.full_name}\nPlan: ${member.membership_plan}`,
          [
            {
              text: 'Scan Again',
              onPress: () => setScanned(false),
            },
          ]
        );
      } else if (status === 'expiring_soon') {
        Alert.alert(
          i18n.t('access_granted'),
          `${i18n.t('membership_expiring')}\n\nMember: ${member.full_name}\nPlan: ${member.membership_plan}\n${daysRemaining} ${i18n.t('days_remaining')}`,
          [
            {
              text: 'Scan Again',
              onPress: () => setScanned(false),
            },
          ]
        );
      } else {
        Alert.alert(
          i18n.t('access_granted'),
          `${i18n.t('checkin_success')}\n\nMember: ${member.full_name}\nPlan: ${member.membership_plan}\n${daysRemaining} ${i18n.t('days_remaining')}`,
          [
            {
              text: 'Scan Again',
              onPress: () => setScanned(false),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert(i18n.t('error'), 'An error occurred while scanning');
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          We need camera access to scan QR codes for member check-in.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{i18n.t('scan_qr_code')}</Text>
        <Text style={styles.subtitle}>Point camera at member's QR code</Text>
      </View>

      {/* Camera */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          {/* Scan Overlay */}
          <View style={styles.overlay}>
            {/* Top */}
            <View style={styles.overlaySection} />
            
            {/* Middle Row */}
            <View style={styles.middleRow}>
              <View style={styles.overlaySection} />
              <View style={styles.scanArea}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                
                {loading && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                )}
              </View>
              <View style={styles.overlaySection} />
            </View>
            
            {/* Bottom */}
            <View style={styles.overlaySection} />
          </View>
        </CameraView>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>How to scan:</Text>
        <Text style={styles.instructionText}>1. Point camera at the member's QR code</Text>
        <Text style={styles.instructionText}>2. Make sure the QR code is within the frame</Text>
        <Text style={styles.instructionText}>3. The system will automatically check membership status</Text>
      </View>

      {/* Last Scanned */}
      {lastScannedMember && (
        <View style={styles.lastScanned}>
          <Text style={styles.lastScannedTitle}>Last Scanned:</Text>
          <Text style={styles.lastScannedName}>{lastScannedMember.full_name}</Text>
          <Text style={styles.lastScannedStatus}>
            Status: {lastScannedMember.status.toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
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
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  overlaySection: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  middleRow: {
    flexDirection: 'row',
    height: SCAN_AREA_SIZE,
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: borderRadius.md,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: borderRadius.md,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: borderRadius.md,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: borderRadius.md,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructions: {
    padding: spacing.lg,
  },
  instructionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  instructionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  lastScanned: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  lastScannedTitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  lastScannedName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  lastScannedStatus: {
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  permissionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  permissionButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});

export default ScannerScreen;

