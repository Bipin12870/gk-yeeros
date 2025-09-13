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
import { theme } from "../../theme";
// Drive image fallback logic: try multiple endpoints

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
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.background }}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginRight: 6 }}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: "900", color: theme.colors.text }}>Our Team</Text>
      </View>

      {staff.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Ionicons name="people-outline" size={48} color="#9CA3AF" />
          <Text style={{ color: theme.colors.muted, marginTop: 10, textAlign: "center" }}>
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

function extractDriveId(url: string): string | undefined {
  const byPath = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (byPath?.[1]) return byPath[1];
  try {
    const u = new URL(url);
    const idParam = u.searchParams.get("id");
    if (idParam) return idParam;
  } catch {}
  return undefined;
}

function buildImageCandidates(url?: string): string[] {
  if (!url) return [];
  const id = extractDriveId(url);
  if (id) {
    return [
      `https://drive.usercontent.google.com/uc?id=${id}`,
      `https://drive.google.com/uc?export=view&id=${id}`,
      `https://drive.google.com/thumbnail?id=${id}&sz=w256`,
      url,
    ];
  }
  return [url];
}

function StaffGridCard({ member, width }: { member: StaffMember; width: number }) {
  const [imgFailed, setImgFailed] = useState(false);
  const [srcIndex, setSrcIndex] = useState(0);
  const candidates = useMemo(() => buildImageCandidates(member.photo), [member.photo]);
  const currentSrc = !imgFailed && candidates[srcIndex];
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=6366F1&color=fff&size=256&bold=true`;

  return (
    <View
      style={{
        width,
        borderRadius: 16,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 10,
        elevation: 2,
        padding: 14,
      }}
    >
      <View style={{ alignItems: "center" }}>
        {currentSrc ? (
          <Image
            source={{ uri: currentSrc }}
            style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: "#F3F4F6" }}
            resizeMode="cover"
            onError={() => {
              if (srcIndex + 1 < candidates.length) setSrcIndex(srcIndex + 1);
              else setImgFailed(true);
            }}
          />
        ) : (
          <Image
            source={{ uri: fallback }}
            style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: "#F3F4F6" }}
            resizeMode="cover"
          />
        )}
        <Text style={{ marginTop: 10, fontSize: 16, fontWeight: "800", color: theme.colors.text }}>
          {member.name}
        </Text>
        {!!member.role && (
          <Text style={{ color: theme.colors.muted, marginTop: 2 }} numberOfLines={1}>
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
