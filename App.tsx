import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { PinScreen }    from "./src/screens/PinScreen";
import { DriverScreen } from "./src/screens/DriverScreen";
import { LeaderScreen } from "./src/screens/LeaderScreen";
import { AdminScreen }  from "./src/screens/AdminScreen";
import { StaffUser }    from "./src/config/auth";
import { Colors }       from "./src/config/theme";
import { RequestStore, ValetRequest } from "./src/config/store";
import { ZohoAuth }     from "./src/config/api";

// ─────────────────────────────────────────────────────────────
//  ZOHO CREDENTIALS — fill in from api-console.zoho.com
//  See README for how to get your first tokens
// ─────────────────────────────────────────────────────────────
const ZOHO_CREDENTIALS = {
  accessToken:  "1000.2b68c734698688c8b24e6b360c93995a.6fbe2c1fdf5caabdec2949e4f5ac5755",
  refreshToken: "1000.c43f656fef2edbbd158398dd519e1173.9c2a9e27914fd776c8ed95cf198cd9e4",
  clientId:     "1000.U5F51VF01A9STLCLWZBU51MGQ78XWM",
  clientSecret: "b533fdc03caa279b1ddcd05ee5fca1f097b9f2efcf",
};

const CREDENTIALS_READY = !Object.values(ZOHO_CREDENTIALS).some(v => v.includes("YOUR_"));

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ── Demo inject (DEV only) ────────────────────────────────────
function DemoInjectBtn() {
  const inject = () => {
    const entries = [
      { name: "Fatima Al Rashidi", plate: "DXB 1234", car: "Mercedes S-Class" },
      { name: "Khalid Hassan",     plate: "ABU 5678", car: "BMW 7 Series"     },
      { name: "Sara Al Zaabi",     plate: "SHJ 9012", car: "Range Rover"      },
    ];
    const e = entries[Math.floor(Math.random() * entries.length)];
    const req: ValetRequest = {
      _localId:      `demo-${Math.random().toString(36).slice(2)}`,
      zohoId:        `demo-${Date.now()}`,
      memberId:      "demo",
      memberName:    e.name,
      membershipTier:"Platinum",
      memberCarId:   "demo",
      parkingId:     null,
      plate:         e.plate,
      carLabel:      e.car,
      status:        "pending",
      time:          new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      createdAt:     Date.now(),
      includeCarWash: false,
      brand:         "Seven",
      location:      "Dubai",
    };
    RequestStore.addLocal(req);
  };

  return (
    <TouchableOpacity onPress={inject} style={styles.demoBtn} activeOpacity={0.7}>
      <Text style={{ color: Colors.textMuted, fontSize: 11, letterSpacing: 1 }}>SIMULATE REQUEST</Text>
    </TouchableOpacity>
  );
}

// ── App Root ──────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<StaffUser | null>(null);

  useEffect(() => {
    Notifications.requestPermissionsAsync();
    if (CREDENTIALS_READY) {
      ZohoAuth.init(ZOHO_CREDENTIALS);
      RequestStore.startPolling();
    }
    return () => RequestStore.stopPolling();
  }, []);

  const handleLogin = (loggedInUser: StaffUser) => {
    setUser(loggedInUser);
    if (CREDENTIALS_READY) RequestStore.startPolling();
  };

  if (!user) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <PinScreen onLogin={handleLogin} />
      </SafeAreaProvider>
    );
  }

  const role = user.role;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: Colors.bg }}>
        {role === "Admin"       && <AdminScreen  user={user} onLogout={() => setUser(null)} />}
        {role === "Team Leader" && <LeaderScreen user={user} onLogout={() => setUser(null)} />}
        {role === "Driver"      && <DriverScreen user={user} onLogout={() => setUser(null)} />}
        {__DEV__ && <DemoInjectBtn />}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  demoBtn: {
    position: "absolute", bottom: 28, alignSelf: "center",
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
});
