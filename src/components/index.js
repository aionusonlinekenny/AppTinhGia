import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

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

export function Header({ title, subtitle }) {
  return (
    <View style={headerStyles.container}>
      <Text style={headerStyles.title}>{title}</Text>
      {subtitle ? <Text style={headerStyles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
});

export function Card({ children, style }) {
  return <View style={[cardStyles.card, style]}>{children}</View>;
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});

export function Button({ label, onPress, variant = 'primary', style, disabled }) {
  const bg =
    variant === 'primary'
      ? COLORS.primary
      : variant === 'danger'
      ? COLORS.error
      : variant === 'success'
      ? COLORS.success
      : COLORS.surface;
  const textColor =
    variant === 'outline' ? COLORS.primary : '#FFF';
  const border =
    variant === 'outline'
      ? { borderWidth: 1.5, borderColor: COLORS.primary }
      : {};

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        btnStyles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.5 : 1 },
        border,
        style,
      ]}
      activeOpacity={0.8}
    >
      <Text style={[btnStyles.label, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const btnStyles = StyleSheet.create({
  btn: {
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
});

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
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
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
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  icon: { fontSize: 28, marginRight: 14 },
  value: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  label: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});

export function Divider() {
  return <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 12 }} />;
}

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

export function Loader() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}
