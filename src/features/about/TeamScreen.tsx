import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { watchStore } from "../../data/repositories/StoreRepo";
import type { StoreRecord, StaffMember } from "../../types/store";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");
const H_PADDING = 16; // screen side padding
const GUTTER = 12;    // space between cards

export default function TeamScreen() {
  const navigation = useNavigation();
  const [store, setStore] = useState<StoreRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = watchStore(
      "MAIN",
      (doc) => {
        setStore(doc);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, []);

  const staff: StaffMember[] = store?.staff ?? [];

  // Determine columns responsively (phones: 2, tablets: 3)
  const columns = useMemo(() => (width >= 768 ? 3 : 2), []);
  const cardWidth = useMemo(() => {
    const totalGutter = GUTTER * (columns - 1);
    const contentWidth = width - H_PADDING * 2 - totalGutter;
    return Math.floor(contentWidth / columns);
  }, [columns]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginRight: 6 }}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: "900", color: "#111827" }}>
          Our Team
        </Text>
      </View>

      {staff.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Ionicons name="people-outline" size={48} color="#9CA3AF" />
          <Text style={{ color: "#6B7280", marginTop: 10, textAlign: "center" }}>
            Staff profiles are coming soon.
          </Text>
        </View>
      ) : (
        <FlatList
          data={staff}
          keyExtractor={(m) => m.id}
          numColumns={columns}
          contentContainerStyle={{ paddingHorizontal: H_PADDING, paddingBottom: 16 }}
          columnWrapperStyle={{ gap: GUTTER, marginBottom: GUTTER }}
          renderItem={({ item }) => (
            <StaffGridCard member={item} width={cardWidth} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function StaffGridCard({ member, width }: { member: StaffMember; width: number }) {
  const photo = member.photo && member.photo.length
    ? { uri: member.photo }
    : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=6366F1&color=fff&size=256&bold=true` };

  return (
    <View
      style={{
        width,
        borderRadius: 16,
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 10,
        elevation: 2,
        padding: 14,
      }}
    >
      <View style={{ alignItems: "center" }}>
        <Image
          source={photo}
          style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: "#F3F4F6" }}
        />
        <Text style={{ marginTop: 10, fontSize: 16, fontWeight: "800", color: "#111827" }}>
          {member.name}
        </Text>
        {!!member.role && (
          <Text style={{ color: "#6B7280", marginTop: 2 }} numberOfLines={1}>
            {member.role}
          </Text>
        )}
      </View>

      {!!member.bio && (
        <View style={{ marginTop: 10 }}>
          <Text style={{ color: "#374151", lineHeight: 18 }} numberOfLines={3}>
            {member.bio}
          </Text>
        </View>
      )}
    </View>
  );
}
