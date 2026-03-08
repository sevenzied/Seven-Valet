import React from "react";
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet, ViewStyle } from "react-native";
import { Colors, Radius, Space, STATUS_CONFIG, Typography } from "../config/theme";
import { RequestStatus } from "../config/store";

type BtnVariant = "primary" | "ghost" | "danger" | "success" | "subtle";
interface BtnProps { label: string; onPress: () => void; variant?: BtnVariant; loading?: boolean; disabled?: boolean; full?: boolean; small?: boolean; icon?: React.ReactNode; style?: ViewStyle; }
const BTN_STYLES: Record<BtnVariant, { bg: string; color: string; border: string }> = {
  primary: { bg: Colors.gold,        color: "#0A0805",      border: "transparent"      },
  ghost:   { bg: "transparent",      color: Colors.textSub, border: Colors.borderMid   },
  danger:  { bg: Colors.redMuted,    color: Colors.red,     border: Colors.redBorder    },
  success: { bg: Colors.greenMuted,  color: Colors.green,   border: Colors.greenBorder  },
  subtle:  { bg: Colors.surfaceHigh, color: Colors.textSub, border: Colors.border       },
};
export function Btn({ label, onPress, variant = "primary", loading, disabled, full, small, icon, style }: BtnProps) {
  const s = BTN_STYLES[variant] || BTN_STYLES["primary"];
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.7}
      style={[{ backgroundColor: s.bg, borderRadius: Radius.sm, borderWidth: 1, borderColor: s.border, paddingVertical: small ? 9 : 13, paddingHorizontal: small ? 14 : 20, alignItems: "center" as const, justifyContent: "center" as const, flexDirection: "row" as const, gap: 8, opacity: disabled ? 0.4 : 1, width: full ? "100%" : undefined }, style]}>
      {loading ? <ActivityIndicator size="small" color={s.color} /> : <>{icon}<Text style={{ color: s.color, fontWeight: "600", fontSize: small ? 12 : 14, letterSpacing: 0.5 }}>{label}</Text></>}
    </TouchableOpacity>
  );
}
export function Badge({ status }: { status: RequestStatus }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1, backgroundColor: s.bg, borderColor: s.border }}>
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: s.color }} />
      <Text style={{ fontSize: 10, fontWeight: "600", color: s.color, letterSpacing: 1, textTransform: "uppercase" }}>{s.label}</Text>
    </View>
  );
}
interface CardProps { children: React.ReactNode; style?: ViewStyle; onPress?: () => void; accentColor?: string; }
export function Card({ children, style, onPress, accentColor }: CardProps) {
  const inner = (<View style={[{ backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Space.md, borderLeftWidth: accentColor ? 2 : 1, borderLeftColor: accentColor || Colors.border }, style]}>{children}</View>);
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.8}>{inner}</TouchableOpacity>;
  return inner;
}
interface InputProps { label?: string; value: string; onChangeText: (v: string) => void; placeholder?: string; secureTextEntry?: boolean; keyboardType?: any; autoCapitalize?: any; style?: ViewStyle; returnKeyType?: any; onSubmitEditing?: () => void; }
export function Input({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize, style, returnKeyType, onSubmitEditing }: InputProps) {
  return (
    <View style={[{ gap: 7 }, style]}>
      {label && <Text style={Typography.label}>{label}</Text>}
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={Colors.textMuted} secureTextEntry={secureTextEntry} keyboardType={keyboardType} autoCapitalize={autoCapitalize || "none"} returnKeyType={returnKeyType} onSubmitEditing={onSubmitEditing}
        style={{ backgroundColor: Colors.surfaceHigh, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: Space.md, paddingVertical: 13, color: Colors.text, fontSize: 14, letterSpacing: 0.3 }} />
    </View>
  );
}
export function Divider({ style }: { style?: ViewStyle }) { return <View style={[{ height: 0.5, backgroundColor: Colors.border, marginVertical: Space.md }, style]} />; }
export function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ paddingHorizontal: 16, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: active ? Colors.surfaceRaised : "transparent", borderWidth: 1, borderColor: active ? Colors.borderMid : "transparent" }}>
      <Text style={{ fontSize: 12, fontWeight: "500", letterSpacing: 0.5, color: active ? Colors.text : Colors.textSub }}>{label}</Text>
    </TouchableOpacity>
  );
}
export function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, marginTop: Space.md }}>
      <Text style={Typography.label}>{title}</Text>
      {right}
    </View>
  );
}
export function EmptyState({ message }: { message: string }) {
  return (
    <View style={{ alignItems: "center", paddingTop: 64, gap: 10 }}>
      <View style={{ width: 40, height: 0.5, backgroundColor: Colors.border }} />
      <Text style={[Typography.caption, { letterSpacing: 1.5, textTransform: "uppercase" }]}>{message}</Text>
    </View>
  );
}
export function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card style={{ flex: 1, alignItems: "center", paddingVertical: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: "200", color, letterSpacing: -1 }}>{value}</Text>
      <Text style={[Typography.label, { marginTop: 6 }]}>{label}</Text>
    </Card>
  );
}
export function Rule() { return <View style={{ height: 0.5, backgroundColor: Colors.border, marginVertical: Space.sm }} />; }
