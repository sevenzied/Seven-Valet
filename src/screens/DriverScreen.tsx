import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, FlatList, SafeAreaView,
  TouchableOpacity, StyleSheet,
} from "react-native";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import { Colors, Space, Typography } from "../config/theme";
import { ValetRequest, RequestStore } from "../config/store";
import { RequestCard } from "../components/RequestCard";
import { EmptyState, Pill, SectionHeader } from "../components/UI";
import { StaffUser } from "../config/auth";

type Filter = "active" | "mine" | "completed";

interface Props { user: StaffUser; onLogout: () => void; }

export function DriverScreen({ user, onLogout }: Props) {
  const [requests, setRequests] = useState<ValetRequest[]>(RequestStore.getAll());
  const [filter, setFilter]     = useState<Filter>("active");
  const prevPending             = useRef(0);

  useEffect(() => {
    const unsub = RequestStore.subscribe(reqs => {
      setRequests(reqs);
      const pending = reqs.filter(r => r.status === "pending").length;
      if (pending > prevPending.current) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        void Notifications.scheduleNotificationAsync({
          content: { title: "🚗 New Valet Request", body: "A member is waiting — tap to view." },
          trigger: null,
        }).catch(() => {});
      }
      prevPending.current = pending;
    });
    return () => {
      unsub();
    };
  }, []);

  // Filter to this driver's club location only
  const locationRequests = requests.filter(r =>
    r.memberHomeClub === user.Club_Location
  );

  const active    = locationRequests.filter(r => r.status !== "completed");
  const mine      = locationRequests.filter(r => r.driverId === user.id);
  const completed = locationRequests.filter(r => r.status === "completed");
  const pending   = locationRequests.filter(r => r.status === "pending").length;

  const filtered = filter === "active" ? active : filter === "mine" ? mine : completed;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={Typography.label}>Welcome back</Text>
          <Text style={[Typography.heading2, { marginTop: 2 }]}>{user.name}</Text>
          {user.Club_Location ? (
            <Text style={{ fontSize: 11, color: Colors.textSub, marginTop: 2, letterSpacing: 0.5 }}>
              {user.Club_Location}
            </Text>
          ) : null}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {pending > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: Colors.red }}>{pending}</Text>
              <Text style={{ fontSize: 9, color: Colors.red, letterSpacing: 0.5 }}>PENDING</Text>
            </View>
          )}
          <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
            <Text style={{ fontSize: 18 }}>⏻</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <Pill label={`Active (${active.length})`}    active={filter === "active"}    onPress={() => setFilter("active")} />
        <Pill label={`My Jobs (${mine.length})`}     active={filter === "mine"}      onPress={() => setFilter("mine")} />
        <Pill label={`Done (${completed.length})`}   active={filter === "completed"} onPress={() => setFilter("completed")} />
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={r => r._localId}
        contentContainerStyle={{ padding: Space.md, paddingBottom: 100 }}
        ListEmptyComponent={<EmptyState icon={filter === "completed" ? "📋" : "🏁"} message={filter === "completed" ? "No completed requests yet" : "No active requests"} />}
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
  filters: {
    flexDirection: "row", gap: 8, paddingHorizontal: Space.md,
    paddingVertical: 12, flexWrap: "nowrap",
  },
  pendingBadge: {
    backgroundColor: Colors.redMuted, borderWidth: 1, borderColor: `${Colors.red}44`,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, alignItems: "center",
  },
  logoutBtn: {
    backgroundColor: Colors.surfaceHigh, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, padding: 8,
  },
});
