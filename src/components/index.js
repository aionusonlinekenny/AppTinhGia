import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const COLORS = {
  primary: '#E65100',
  primaryLight: '#FF8A50',
  primaryDark: '#AC1900',
  secondary: '#FFF3E0',
  accent: '#FFB300',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#BDBDBD',
  border: '#E0E0E0',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  electricity: '#FFF176',
  water: '#B3E5FC',
  gas: '#FFCCBC',
  rent: '#E8EAF6',
  other: '#F3E5F5',
};

// Gradient presets for reuse across screens
export const GRADIENTS = {
  primary:  ['#FF7043', '#E65100'],
  primaryV: ['#FF8A65', '#BF360C'],   // vertical variant
  success:  ['#66BB6A', '#2E7D32'],
  danger:   ['#EF5350', '#B71C1C'],
  warning:  ['#FFA726', '#E65100'],
  info:     ['#42A5F5', '#1565C0'],
  gold:     ['#FFD54F', '#FF8F00'],
  dark:     ['#546E7A', '#263238'],
  purple:   ['#AB47BC', '#6A1B9A'],
  teal:     ['#26C6DA', '#00838F'],
  header:   ['#FF7043', '#E64A19', '#BF360C'],
  quickCost:['#43A047', '#1B5E20'],
};

// ── Header ────────────────────────────────────────────────────────
export function Header({ title, subtitle }) {
  return (
    <LinearGradient
      colors={GRADIENTS.header}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={headerStyles.container}
    >
      <Text style={headerStyles.title}>{title}</Text>
      {subtitle ? <Text style={headerStyles.subtitle}>{subtitle}</Text> : null}
    </LinearGradient>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 4,
  },
});

// ── Card ─────────────────────────────────────────────────────────
export function Card({ children, style }) {
  return (
    <View style={[cardStyles.card, style]}>
      {children}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#E65100',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
});

// ── 3D Gradient Button ────────────────────────────────────────────
const VARIANT_CONFIG = {
  primary: {
    gradient: GRADIENTS.primary,
    shadow:   '#BF360C',
    text:     '#FFF',
  },
  success: {
    gradient: GRADIENTS.success,
    shadow:   '#1B5E20',
    text:     '#FFF',
  },
  danger: {
    gradient: GRADIENTS.danger,
    shadow:   '#7F0000',
    text:     '#FFF',
  },
  warning: {
    gradient: GRADIENTS.warning,
    shadow:   '#BF360C',
    text:     '#FFF',
  },
  info: {
    gradient: GRADIENTS.info,
    shadow:   '#0D47A1',
    text:     '#FFF',
  },
  outline: {
    gradient: ['#FFFFFF', '#F5F5F5'],
    shadow:   '#BDBDBD',
    text:     COLORS.primary,
  },
};

// 3D effect: outer View with paddingBottom creates "bottom edge" in shadow color
export function Button({ label, onPress, variant = 'primary', style, disabled, loading }) {
  const cfg = VARIANT_CONFIG[variant] || VARIANT_CONFIG.primary;
  const isOutline = variant === 'outline';

  return (
    <View
      style={[
        btnStyles.shadow3d,
        { backgroundColor: cfg.shadow, shadowColor: cfg.shadow },
        isOutline && btnStyles.outlineShadow,
        { opacity: (disabled || loading) ? 0.5 : 1 },
        style,
      ]}
    >
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.82}>
        <LinearGradient
          colors={cfg.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            btnStyles.inner,
            isOutline && { borderWidth: 1.5, borderColor: COLORS.primary },
          ]}
        >
          {loading
            ? <ActivityIndicator color={cfg.text} size="small" />
            : <Text style={[btnStyles.label, { color: cfg.text }]}>{label}</Text>
          }
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const btnStyles = StyleSheet.create({
  shadow3d: {
    borderRadius: 12,
    paddingBottom: 4,        // 4px bottom edge = 3D depth
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
    marginVertical: 2,
  },
  outlineShadow: {
    backgroundColor: '#BDBDBD',
    shadowOpacity: 0.12,
    elevation: 2,
    paddingBottom: 2,
  },
  inner: {
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

// ── FAB (Floating Action Button) ─────────────────────────────────
export function FAB({ onPress, icon = '+', colors = GRADIENTS.primary }) {
  return (
    <View style={fabStyles.wrapper}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.82}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={fabStyles.inner}
        >
          <Text style={fabStyles.icon}>{icon}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const fabStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    borderRadius: 30,
    backgroundColor: '#AC1900',  // 3D bottom edge color
    paddingBottom: 4,             // creates the 3D depth
    shadowColor: '#AC1900',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
  },
  inner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 26,
    color: '#FFF',
    lineHeight: 30,
    fontWeight: '700',
  },
});

// ── Input ─────────────────────────────────────────────────────────
export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline,
  right,
  error,
}) {
  return (
    <View style={inputStyles.wrapper}>
      {label ? <Text style={inputStyles.label}>{label}</Text> : null}
      <View style={[inputStyles.row, error ? inputStyles.errorBorder : {}]}>
        <TextInput
          style={[inputStyles.input, right ? { flex: 1 } : {}]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLight}
          keyboardType={keyboardType}
          multiline={multiline}
        />
        {right ? <Text style={inputStyles.right}>{right}</Text> : null}
      </View>
      {error ? <Text style={inputStyles.error}>{error}</Text> : null}
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 12,
  },
  input: {
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 11,
    flex: 1,
  },
  right: {
    fontSize: 14,
    color: COLORS.textSecondary,
    paddingLeft: 8,
  },
  errorBorder: { borderColor: COLORS.error },
  error: { fontSize: 12, color: COLORS.error, marginTop: 4 },
});

// ── Section Title ─────────────────────────────────────────────────
export function SectionTitle({ text, action, onAction }) {
  return (
    <View style={stStyles.row}>
      <Text style={stStyles.text}>{text}</Text>
      {action ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={stStyles.action}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const stStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  action: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

// ── Empty State ───────────────────────────────────────────────────
export function EmptyState({ icon, message }) {
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.icon}>{icon || '📋'}</Text>
      <Text style={emptyStyles.message}>{message || 'Chưa có dữ liệu'}</Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  icon: { fontSize: 48, marginBottom: 12 },
  message: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center' },
});

// ── Stat Card ─────────────────────────────────────────────────────
export function StatCard({ label, value, color, icon }) {
  return (
    <View style={[scStyles.card, { borderLeftColor: color || COLORS.primary }]}>
      <Text style={scStyles.icon}>{icon}</Text>
      <View>
        <Text style={scStyles.value}>{value}</Text>
        <Text style={scStyles.label}>{label}</Text>
      </View>
    </View>
  );
}

const scStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  icon: { fontSize: 28, marginRight: 14 },
  value: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  label: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});

// ── Divider ───────────────────────────────────────────────────────
export function Divider() {
  return <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 12 }} />;
}

// ── Badge ─────────────────────────────────────────────────────────
export function Badge({ text, color }) {
  return (
    <View style={[badgeStyles.badge, { backgroundColor: color || COLORS.secondary }]}>
      <Text style={[badgeStyles.text, { color: COLORS.primary }]}>{text}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, fontWeight: '600' },
});

// ── Loader ────────────────────────────────────────────────────────
export function Loader() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

// ── GradientButton (inline, no absolute positioning) ─────────────
// Use this when Button wrapper causes layout issues
export function GradientButton({ label, onPress, colors, textColor = '#FFF', style, disabled }) {
  const gradColors = colors || GRADIENTS.primary;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.82}
      style={[gbStyles.wrapper, { opacity: disabled ? 0.5 : 1 }, style]}
    >
      <LinearGradient
        colors={gradColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={gbStyles.inner}
      >
        <Text style={[gbStyles.label, { color: textColor }]}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const gbStyles = StyleSheet.create({
  wrapper: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    marginVertical: 2,
  },
  inner: {
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
