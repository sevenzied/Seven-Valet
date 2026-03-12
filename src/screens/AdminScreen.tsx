import React, { useState, useEffect, useMemo } from "react";
import {
  View, Text, FlatList, SafeAreaView,
  TouchableOpacity, StyleSheet, ScrollView, Dimensions,
} from "react-native";
import { Colors, Space, Typography, STATUS_CONFIG } from "../config/theme";
import { ValetRequest, RequestStore } from "../config/store";
import { RequestCard } from "../components/RequestCard";
import { Card, EmptyState, Input, Pill, SectionHeader, StatCard } from "../components/UI";
import { searchMembersZoho3, debugZohoModules, debugContacts } from "../config/api";
import { StaffUser } from "../config/auth";

const SCREEN_W = Dimensions.get("window").width;

// Simulated weekly data — replace with real API call
const WEEKLY = [
  { day: "Mon", count: 12 },
  { day: "Tue", count: 18 },
  { day: "Wed", count: 9  },
  { day: "Thu", count: 22 },
  { day: "Fri", count: 27 },
  { day: "Sat", count: 34 },
  { day: "Sun", count: 19 },
];
const MAX_COUNT = Math.max(...WEEKLY.map(d => d.count));
const BAR_H = 80;

interface Props { user: StaffUser; onLogout: () => void; }

export function AdminScreen({ user, onLogout }: Props) {
  const [requests, setRequests] = useState<ValetRequest[]>(RequestStore.getAll());
  const [tab, setTab]           = useState<"overview" | "requests" | "members">("overview");
  const [searchQ, setSearchQ]   = useState("");
  const [searchRes, setSearchRes] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  useEffect(() => {
    debugZohoModules();
    debugContacts();
    const unsub = RequestStore.subscribe(setRequests);
    return () => { unsub(); };
  }, []);

  // Derive unique locations from requests (memberHomeClub + location)
  const availableLocations = useMemo(() => {
    const locs = new Set<string>();
    requests.forEach(r => {
      if (r.memberHomeClub) locs.add(r.memberHomeClub);
      if (r.location) locs.add(r.location);
    });
    return Array.from(locs).sort();
  }, [requests]);

  // Filter requests by selected location (null = All)
  const locationRequests = useMemo(() => {
    if (!selectedLocation) return requests;
    return requests.filter(r =>
      r.memberHomeClub === selectedLocation || r.location === selectedLocation
    );
  }, [requests, selectedLocation]);

  const byStatus = (s: string) => locationRequests.filter(r => r.status === s).length;
  const active   = locationRequests.filter(r => r.status !== "completed").length;
  const total    = locationRequests.length;

  const doSearch = async () => {
    if (!searchQ.trim()) return;
    setSearching(true);
    try {
      const data = await searchMembersZoho3(searchQ);
      const arr = Array.isArray(data) ? data : [];
      setSearchRes(arr);
    } catch {
      setSearchRes([]);
    }
    setSearching(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={{ fontSize: 11, color: Colors.green, letterSpacing: 1, textTransform: "uppercase" }}>Administrator</Text>
          <Text style={[Typography.heading2, { marginTop: 2 }]}>Dashboard</Text>
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

      {/* Tab bar */}
      <View style={styles.tabs}>
        {(["overview","requests","members"] as const).map(t => (
          <Pill key={t} label={t.charAt(0).toUpperCase() + t.slice(1)}
            active={tab === t} onPress={() => setTab(t)} />
        ))}
      </View>

      {/* Location switcher (admins only) */}
      {availableLocations.length > 0 && (
        <View style={styles.locationRow}>
          <Text style={[Typography.label, { marginBottom: 8 }]}>Location</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.locationPills}>
            <Pill
              label={`All (${requests.length})`}
              active={selectedLocation === null}
              onPress={() => setSelectedLocation(null)}
            />
            {availableLocations.map(loc => {
              const count = requests.filter(r =>
                r.memberHomeClub === loc || r.location === loc
              ).length;
              return (
                <Pill
                  key={loc}
                  label={`${loc} (${count})`}
                  active={selectedLocation === loc}
                  onPress={() => setSelectedLocation(loc)}
                />
              );
            })}
          </ScrollView>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: Space.md, paddingBottom: 100 }}>

        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && (
          <>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
              <StatCard label="Today"     value={total}    color={Colors.gold}    icon="📋" />
              <StatCard label="Active"    value={active}   color={Colors.blue}    icon="⚡" />
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
              <StatCard label="Parked"    value={byStatus("parked")}    color={Colors.green}   icon="🅿️" />
              <StatCard label="Completed" value={byStatus("completed")} color={Colors.textSub} icon="✅" />
            </View>

            {/* Weekly bar chart */}
            <Card style={{ marginBottom: 16 }}>
              <SectionHeader title="Cars Parked — This Week" />
              <View style={{ flexDirection: "row", alignItems: "flex-end", height: BAR_H + 30, gap: 6 }}>
                {WEEKLY.map((d, i) => {
                  const barH = Math.max(4, (d.count / MAX_COUNT) * BAR_H);
                  const isToday = i === 6;
                  return (
                    <View key={d.day} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end" }}>
                      <Text style={{ fontSize: 9, color: Colors.textMuted, marginBottom: 3 }}>{d.count}</Text>
                      <View style={{
                        width: "75%", height: barH, borderRadius: 4,
                        backgroundColor: isToday ? Colors.gold : Colors.goldMuted,
                      }} />
                      <Text style={{ fontSize: 9, color: isToday ? Colors.goldLight : Colors.textMuted, marginTop: 5 }}>
                        {d.day}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 14,
                paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border }}>
                <Text style={{ fontSize: 12, color: Colors.textSub }}>Weekly Total</Text>
                <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.goldLight }}>
                  {WEEKLY.reduce((a, b) => a + b.count, 0)} cars
                </Text>
              </View>
            </Card>

            {/* Status breakdown */}
            <Card>
              <SectionHeader title="Status Breakdown" />
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const count = byStatus(key);
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <View key={key} style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <Text style={{ fontSize: 16, width: 24 }}>{cfg.icon}</Text>
                    <Text style={{ color: Colors.textSub, fontSize: 13, width: 82 }}>{cfg.label}</Text>
                    <View style={{ flex: 1, height: 6, backgroundColor: Colors.surfaceHigh, borderRadius: 3, overflow: "hidden" }}>
                      <View style={{ height: "100%", width: `${pct}%`, backgroundColor: cfg.color, borderRadius: 3 }} />
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: cfg.color, width: 20, textAlign: "right" }}>{count}</Text>
                  </View>
                );
              })}
            </Card>
          </>
        )}

        {/* ── REQUESTS TAB ── */}
        {tab === "requests" && (
          <>
            <Text style={[Typography.bodySmall, { marginBottom: 12 }]}>
              {selectedLocation ? `${selectedLocation} — ` : ""}{locationRequests.length} request{locationRequests.length !== 1 ? "s" : ""} — tap any card to manage
            </Text>
            {locationRequests.length === 0
              ? <EmptyState icon="📋" message={selectedLocation ? `No requests for ${selectedLocation}` : "No requests yet"} />
              : [...locationRequests].reverse().map(r => <RequestCard key={r._localId} req={r} user={user} />)
            }
          </>
        )}

        {/* ── MEMBERS TAB ── */}
        {tab === "members" && (
          <>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <Input placeholder="Search by name or ID…" value={searchQ}
                  onChangeText={setSearchQ} returnKeyType="search" onSubmitEditing={doSearch} />
              </View>
              <TouchableOpacity onPress={doSearch} style={styles.searchBtn}>
                <Text style={{ fontSize: 18 }}>{searching ? "⏳" : "🔍"}</Text>
              </TouchableOpacity>
            </View>
            {searchRes.map((m, i) => (
              <Card key={i} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View>
                    <Text style={{ fontWeight: "700", color: Colors.text, fontSize: 15 }}>{m.name || m.fullName}</Text>
                    <Text style={{ color: Colors.textSub, fontSize: 12, marginTop: 3 }}>{m.email}</Text>
                    <Text style={{ color: Colors.textMuted, fontSize: 11, marginTop: 2 }}>{m.membershipId}</Text>
                  </View>
                  <View style={{ backgroundColor: Colors.goldMuted, paddingHorizontal: 10, paddingVertical: 5,
                    borderRadius: 8, borderWidth: 1, borderColor: `${Colors.gold}33` }}>
                    <Text style={{ color: Colors.goldLight, fontSize: 12, fontWeight: "700" }}>
                      {m.membershipType || m.plan || "Member"}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
            {searchRes.length === 0 && searchQ !== "" && !searching && (
              <EmptyState icon="🔍" message="No members found" />
            )}
          </>
        )}
      </ScrollView>
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
  tabs: { flexDirection: "row", gap: 8, paddingHorizontal: Space.md, paddingVertical: 12 },
  locationRow: { paddingHorizontal: Space.md, paddingBottom: 12 },
  locationPills: { flexDirection: "row", gap: 8 },
  logoutBtn: {
    backgroundColor: Colors.surfaceHigh, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, padding: 8,
  },
  searchBtn: {
    backgroundColor: Colors.surfaceHigh, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, width: 50, alignItems: "center", justifyContent: "center",
  },
});
