import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Colors, STATUS_CONFIG, Space, Radius, Typography } from "../config/theme";
import { ValetRequest, RequestStore } from "../config/store";
import { markAsParked, markUnparkRequested, markAsDelivered } from "../config/api";
import { Badge, Btn, Card, Divider, Input } from "./UI";
import { StaffUser } from "../config/auth";

interface Props {
  req: ValetRequest;
  user: StaffUser;
}

export function RequestCard({ req, user }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [spot, setSpot]         = useState(req.spot || "");
  const [photo, setPhoto]       = useState<string | null>(req.photoUri || null);

  const s = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;

  const update = (patch: Partial<ValetRequest>) => {
    RequestStore.update(req._localId, patch);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Step 1: Accept the request
  const doAccept = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    update({ status: "accepted", driverId: user.id, driverName: user.name });
    setLoading(false);
  };

  // Step 2: Start parking (local only — driver is walking to car)
  const doStartParking = () => {
    update({ status: "parking" });
  };

  // Step 3: Mark as parked — updates Zoho with spot number
  const doMarkParked = async () => {
    if (!spot.trim()) {
      Alert.alert("Spot Required", "Please enter the parking spot number.");
      return;
    }
    setLoading(true);
    try {
      await markAsParked(req._localId, spot.trim());
    } catch (e) {
      console.warn("markAsParked error:", e);
    }
    update({ status: "parked", spot: spot.trim(), photoUri: photo || undefined });
    setLoading(false);
    setExpanded(false);
  };

  // Step 4: Member requests car back — updates Zoho
  const doStartRetrieval = async () => {
    setLoading(true);
    try {
      await markUnparkRequested(req._localId);
    } catch (e) {
      console.warn("markUnparkRequested error:", e);
    }
    update({ status: "retrieving" });
    setLoading(false);
  };

  // Step 5 & 6: Local status updates
  const doCarReady = () => update({ status: "ready" });
  const doComplete = async () => { try { await markAsDelivered(req._localId); } catch(e) { console.warn("deliver error:", e); } update({ status: "completed" }); setExpanded(false); };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera Permission", "Camera access is needed to photograph the car.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const renderActions = () => {
    switch (req.status) {
      case "pending":
        return <Btn label="Accept Request" onPress={doAccept} loading={loading} full />;

      case "accepted":
        return <Btn label="Start Parking" onPress={doStartParking} full />;

      case "parking":
        return (
          <View style={{ gap: Space.sm }}>
            <Input
              label="Parking Spot *"
              value={spot}
              onChangeText={setSpot}
              placeholder="e.g. B2-14"
              autoCapitalize="characters"
            />
            <TouchableOpacity onPress={pickPhoto} style={{
              backgroundColor: Colors.surfaceHigh, borderRadius: Radius.md,
              borderWidth: 1, borderColor: photo ? Colors.green : Colors.border,
              padding: 12, alignItems: "center", flexDirection: "row",
              justifyContent: "center", gap: 8,
            }}>
              {photo
                ? <Image source={{ uri: photo }} style={{ width: 36, height: 36, borderRadius: 6 }} />
                : <Text style={{ fontSize: 20 }}>📷</Text>
              }
              <Text style={{ color: photo ? Colors.green : Colors.textSub, fontWeight: "600", fontSize: 14 }}>
                {photo ? "Photo Added ✓" : "Add Car Photo"}
              </Text>
            </TouchableOpacity>
            <Btn label="Mark as Parked" variant="success" onPress={doMarkParked} loading={loading} full />
          </View>
        );

      case "parked":
        return (
          <View style={{ gap: Space.sm }}>
            {req.spot && (
              <View style={{ backgroundColor: Colors.greenMuted, borderRadius: Radius.md,
                padding: 12, alignItems: "center" }}>
                <Text style={{ color: Colors.textSub, fontSize: 12 }}>Parked at</Text>
                <Text style={{ color: Colors.green, fontSize: 22, fontWeight: "800" }}>{req.spot}</Text>
              </View>
            )}
            <Btn label="Start Retrieval" variant="ghost" onPress={doStartRetrieval} loading={loading} full />
          </View>
        );

      case "retrieving":
        return <Btn label="Car is Ready" variant="success" onPress={doCarReady} full />;

      case "ready":
        return <Btn label="Mark Completed" variant="ghost" onPress={doComplete} full />;

      default:
        return null;
    }
  };

  if (req.status === "completed") {
    return (
      <Card style={{ marginBottom: 10, opacity: 0.6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ color: Colors.textSub, fontSize: 14, fontWeight: "600" }}>{req.memberName}</Text>
            <Text style={{ color: Colors.textMuted, fontSize: 12 }}>{req.plate} · {req.time}</Text>
          </View>
          <Badge status="completed" />
        </View>
      </Card>
    );
  }

  return (
    <Card accentColor={s.color} style={{ marginBottom: 12 }}>
      <TouchableOpacity onPress={() => setExpanded(e => !e)} activeOpacity={0.85}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
            <View style={{ width: 46, height: 46, borderRadius: Radius.md,
              backgroundColor: `${s.color}18`, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 22 }}>{s.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", fontSize: 15, color: Colors.text }}>{req.memberName}</Text>
              <Text style={{ color: Colors.textSub, fontSize: 12, marginTop: 2 }}>
                {req.plate}  ·  {req.carLabel}
              </Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                <Text style={{ fontSize: 11, color: Colors.textMuted }}>🕐 {req.time}</Text>
                {req.location && <Text style={{ fontSize: 11, color: Colors.textMuted }}>📍 {req.location}</Text>}
                {req.spot && <Text style={{ fontSize: 11, color: Colors.green }}>🅿️ {req.spot}</Text>}
                {req.driverName && <Text style={{ fontSize: 11, color: Colors.textSub }}>👤 {req.driverName}</Text>}
              </View>
            </View>
          </View>
          <View style={{ alignItems: "flex-end", gap: 6 }}>
            <Badge status={req.status} />
            <Text style={{ color: Colors.textMuted, fontSize: 18 }}>{expanded ? "▲" : "▼"}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View>
          <Divider />
          <View style={{ flexDirection: "row", gap: 16, marginBottom: 14 }}>
            <View style={{ flex: 1 }}>
              <Text style={Typography.label}>Membership</Text>
              <Text style={{ color: Colors.goldLight, fontWeight: "700", fontSize: 13, marginTop: 2 }}>
                {req.membershipTier || "Member"}
              </Text>
            </View>
          </View>
          {renderActions()}
        </View>
      )}
    </Card>
  );
}
