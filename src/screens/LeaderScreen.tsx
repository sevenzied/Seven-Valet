import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, FlatList, SafeAreaView,
  TouchableOpacity, StyleSheet, ScrollView,
} from "react-native";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import { Colors, Space, Typography, STATUS_CONFIG } from "../config/theme";
import { ValetRequest, RequestStore } from "../config/store";
import { RequestCard } from "../components/RequestCard";
import { Card, EmptyState, Pill, StatCard } from "../components/UI";
import { StaffUser } from "../config/auth";

interface Props { user: StaffUser; onLogout: () => void; }

export function LeaderScreen({ user, onLogout }: Props) {
  const [requests, setRequests] = useState<ValetRequest[]>(RequestStore.getAll());
  const [tab, setTab]           = useState<"live" | "all">("live");
  const prevPending             = useRef(0);

  useEffect(() => {
    void RequestStore.subscribe(reqs => {
      setRequests(reqs);
      const pending = reqs.filter(r => r.status === "pending").length;
      if (pending > prevPending.current) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        void Notifications.scheduleNotificationAsync({
          content: { title: "⚡ Pending Valet Request", body: `${pending} request${pending > 1 ? "s" : ""} waiting for a driver.` },
          trigger: null,
        }).catch(() => {});
      }
      prevPending.current = pending;
    });
    return () => {};
  }, []);

  // Filter to this leader's club location only
  const locationRequests = requests.filter(r =>
    r.memberHomeClub === user.Club_Location
  );

  const active    = locationRequests.filter(r => r.status !== "completed");
  const pending   = locationRequests.filter(r => r.status === "pending").length;
  const parking   = locationRequests.filter(r => ["parking", "accepted"].includes(r.status)).length;
  const parked    = locationRequests.filter(r => r.status === "parked").length;
  const displayed = tab === "live" ? active : locationRequests;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={{ fontSize: 11, color: Colors.gold, letterSpacing: 1, textTransform: "uppercase" }}>Team Leader</Text>
          <Text style={[Typography.heading2, { marginTop: 2 }]}>{user.name}</Text>
          {user.Club_Location ? (
            <Text style={{ fontSize: 11, color: Colors.textSub, marginTop: 2, letterSpacing: 0.5 }}>
              {user.Club_Location}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Text style={{ fontSize: 18 }}>⏻</Text>
        </TouchableOpacity>
      </View>

      {/* Stats strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingHorizontal: Space.md, paddingVertical: 14 }}>
        <StatCard label="Pending"  value={pending}               color={Colors.amber} icon="⏳" />
        <StatCard label="Parking"  value={parking}               color={Colors.gold}  icon="🚗" />
        <StatCard label="Parked"   value={parked}                color={Colors.green} icon="🅿️" />
        <StatCard label="Active"   value={active.length}         color={Colors.blue}  icon="⚡" />
        <StatCard label="Total"    value={locationRequests.length} color={Colors.textSub} icon="📋" />
      </ScrollView>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pill label={`🔴 Live (${active.length})`}         active={tab === "live"} onPress={() => setTab("live")} />
        <Pill label={`All (${locationRequests.length})`}   active={tab === "all"}  onPress={() => setTab("all")} />
      </View>

      {/* Request list */}
      <FlatList
        data={displayed}
        keyExtractor={r => r._localId}
        contentContainerStyle={{ padding: Space.md, paddingBottom: 100 }}
        ListEmptyComponent={<EmptyState icon="✅" message="All clear — no active requests" />}
        renderItem={({ item }) => <RequestCard req={item} user={user} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Space.md, paddingVertical: Space.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tabs: { flexDirection: "row", gap: 8, paddingHorizontal: Space.md, paddingBottom: 10 },
  logoutBtn: {
    backgroundColor: Colors.surfaceHigh, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, padding: 8,
  },
});
