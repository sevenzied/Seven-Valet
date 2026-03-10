import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Animated, ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Colors, Radius, Space, Typography, ROLE_CONFIG } from "../config/theme";
import { StaffUser, verifyPin } from "../config/auth";
import { fetchValetStaff, ZohoStaffRecord } from "../config/api";

interface Props {
  onLogin: (user: StaffUser) => void;
}

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["",  "0", "DEL"],
];

export function PinScreen({ onLogin }: Props) {
  const [pin, setPin]           = useState("");
  const [error, setError]       = useState("");
  const [matched, setMatched]   = useState<StaffUser | null>(null);
  const [staff, setStaff]       = useState<ZohoStaffRecord[]>([]);
  const [loading, setLoading]   = useState(true);
  const [checking, setChecking] = useState(false);
  const shakeAnim               = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchValetStaff()
      .then(data => { console.log("STAFF:", JSON.stringify(data)); setStaff(data); })
      .catch(() => setError("Could not connect to server."))
      .finally(() => setLoading(false));
  }, []);

  const shake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 7,   duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -7,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const checkPin = async (fullPin: string) => {
    setChecking(true);
    try {
      for (const s of staff) {
        const match = await verifyPin(fullPin, s.PIN_Hash);
        if (match) {
          const user: StaffUser = {
            id:            s.id,
            staffId:       s.Staff_ID,
            name:          s.Name,
            role:          s.Role,
            location:      s.Club_Location || "Dubai",
            Club_Location: s.Club_Location || null,
            active:        s.Active,
            pinHash:       s.PIN_Hash,
          };
          setMatched(user);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTimeout(() => onLogin(user), 1000);
          setChecking(false);
          return;
        }
      }
      shake();
      setError("Incorrect PIN.");
      setTimeout(() => { setPin(""); setError(""); }, 1400);
    } catch(err: any) {
      console.log("PIN ERROR:", err.message, err.stack);
      shake();
      setError("An error occurred. Try again.");
      setTimeout(() => { setPin(""); setError(""); }, 1400);
    }
    setChecking(false);
  };

  const press = async (k: string) => {
    if (checking || matched) return;
    if (k === "") return;

    if (k === "DEL") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPin(p => p.slice(0, -1));
      setError("");
      return;
    }

    if (pin.length >= 4) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = pin + k;
    setPin(next);

    if (next.length === 4) await checkPin(next);
  };

  const roleConf = matched ? (ROLE_CONFIG[matched.role] || ROLE_CONFIG.driver) : null;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LogoMark />
        <View style={{ alignItems: "center", gap: 16 }}>
          <ActivityIndicator color={Colors.gold} />
          <Text style={[Typography.caption, { letterSpacing: 1.5 }]}>CONNECTING</Text>
        </View>
        <View />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LogoMark />

      <Animated.View style={[styles.center, { transform: [{ translateX: shakeAnim }] }]}>
        {matched ? (
          <View style={styles.successWrap}>
            <View style={[styles.rolePill, { borderColor: `${roleConf!.color}40` }]}>
              <View style={[styles.roleDot, { backgroundColor: roleConf!.color }]} />
              <Text style={[Typography.label, { color: roleConf!.color, letterSpacing: 1.5 }]}>
                {roleConf!.label}
              </Text>
            </View>
            <Text style={[Typography.heading1, { marginTop: 12, textAlign: "center" }]}>
              {matched.name.split(" ")[0]}
            </Text>
            <Text style={[Typography.bodySmall, { marginTop: 4 }]}>
              {matched.location}
            </Text>
          </View>
        ) : (
          <View style={styles.center}>
            <Text style={[Typography.label, { marginBottom: 28, letterSpacing: 2 }]}>
              ENTER PIN
            </Text>
            <View style={styles.dots}>
              {Array.from({ length: 4 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i < pin.length && styles.dotFilled,
                    error ? styles.dotError : null,
                  ]}
                />
              ))}
            </View>
            <View style={{ height: 20, marginTop: 16, alignItems: "center" }}>
              {checking
                ? <ActivityIndicator size="small" color={Colors.textMuted} />
                : error
                ? <Text style={[Typography.caption, { color: Colors.red }]}>{error}</Text>
                : null
              }
            </View>
          </View>
        )}
      </Animated.View>

      {!matched && (
        <View style={styles.keypad}>
          {KEYS.map((row, ri) => (
            <View key={ri} style={styles.keyRow}>
              {row.map((k, ki) => (
                <TouchableOpacity
                  key={ki}
                  onPress={() => press(k)}
                  disabled={k === "" || checking}
                  activeOpacity={k === "" ? 1 : 0.6}
                  style={[
                    styles.key,
                    k === "" && styles.keyEmpty,
                    k === "DEL" && styles.keyDel,
                  ]}
                >
                  {k === "DEL" ? (
                    <View style={{ gap: 3, alignItems: "flex-end" }}>
                      <View style={{ width: 14, height: 1.5, backgroundColor: Colors.textMuted, borderRadius: 1 }} />
                      <View style={{ width: 10, height: 1.5, backgroundColor: Colors.textMuted, borderRadius: 1 }} />
                    </View>
                  ) : k === "" ? null : (
                    <Text style={styles.keyText}>{k}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

function LogoMark() {
  return (
    <View style={styles.logoWrap}>
      <Text style={styles.wordmark}>SEVEN</Text>
      <View style={styles.rule} />
      <Text style={[Typography.label, { letterSpacing: 3 }]}>VALET</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 56,
    paddingHorizontal: 32,
  },
  center: { alignItems: "center" },
  logoWrap: { alignItems: "center", gap: 10 },
  wordmark: {
    fontSize: 26,
    fontWeight: "200",
    color: Colors.text,
    letterSpacing: 10,
  },
  rule: {
    width: 32,
    height: 0.5,
    backgroundColor: Colors.gold,
  },
  dots: { flexDirection: "row", gap: 20 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderMid,
    backgroundColor: "transparent",
  },
  dotFilled: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  dotError: {
    borderColor: Colors.red,
    backgroundColor: Colors.redMuted,
  },
  successWrap: { alignItems: "center", gap: 4 },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  roleDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  keypad: { width: "100%", gap: 10 },
  keyRow: { flexDirection: "row", gap: 10 },
  key: {
    flex: 1,
    aspectRatio: 1.6,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  keyEmpty: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  keyDel: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  keyText: {
    fontSize: 20,
    fontWeight: "300",
    color: Colors.text,
    letterSpacing: 1,
  },
});
