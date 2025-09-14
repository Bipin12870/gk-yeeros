// HomeScreen.tsx (drop-in)
// Fetches /stores/MAIN via StoreRepo and renders header/state with real data.
// Requires: src/data/repositories/StoreRepo.ts and src/utils/openNow.ts from earlier steps.

import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  Animated,
  Platform,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../theme";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../app/AppNavigator";
import { useAuth } from "../auth/AuthProvider";
import { useCart } from "../../state/stores/useCartStore";
import { useToast } from "../../state/ui/ToastProvider";
import { auth } from "../../lib/firebase";

import { watchStore } from "../../data/repositories/StoreRepo";
import { watchItems, type ItemRecord } from "../../data/repositories/ItemRepo";
import { watchCategories, type CategoryRecord } from "../../data/repositories/CategoryRepo";
import type { StoreRecord } from "../../types/store";
import { isOpenNow } from "../../utils/openNow";

// Items pulled from Firestore

const screen = Dimensions.get("window").width;
const GUTTER = 20;
// Compact cards: slightly narrower with shorter image height for a modern look
const CARD_W = Math.floor((screen - GUTTER * 2 - 16) / 2.6);
const IMG_H = Math.floor(CARD_W * 0.58); // shorter than square for balance

// Google Drive helpers (mirror TeamScreen behavior)
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
      `https://drive.google.com/thumbnail?id=${id}&sz=w512`,
      url,
    ];
  }
  return [url];
}

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  // iPhone with Dynamic Island (e.g., 14 Pro/Max) has ~59px top inset; add extra breathing room
  const baseTop = Platform.OS === 'ios' ? Math.max(insets.top || 0, 44) : Math.max(insets.top || 0, 24);
  const extraTop = Platform.OS === 'ios' && (insets.top || 0) >= 47 ? 20 : 8;
  const topPad = baseTop + extraTop;
  const [query, setQuery] = useState("");
  // Filter by high-level group (e.g., regular vs kids). 'all' shows both.
  const [category, setCategory] = useState<string>("all");
  // Show filter chips only when toggled
  const [showFilters, setShowFilters] = useState(false);
  const { totalCount } = useCart();
  const { user, verified } = useAuth();
  const isAuthed = !!user && !!verified;
  const toast = useToast();

  // Store data
  const [store, setStore] = useState<StoreRecord | null>(null);
  const [loadingStore, setLoadingStore] = useState(true);
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const unsub = watchStore("MAIN", (doc) => {
      setStore(doc);
      setLoadingStore(false);
    }, () => setLoadingStore(false));
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = watchItems('MAIN', (list) => {
      setItems(list);
      setLoadingItems(false);
    }, () => setLoadingItems(false));
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = watchCategories('MAIN', (list) => {
      setCategories(list);
      setLoadingCategories(false);
    }, () => setLoadingCategories(false));
    return unsub;
  }, []);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    if (totalCount > 0) {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [totalCount]);

  const open = useMemo(() => isOpenNow(store?.hours), [store?.hours]);
  const canOrder = useMemo(() => {
    const online = store?.online !== false; // default true
    const pickupEnabled = store?.pickup?.enabled !== false; // default true
    return online && pickupEnabled && open;
  }, [store?.online, store?.pickup?.enabled, open]);

  // Filters
  // Map categoryId -> groupId for group-based filtering (regular/kids)
  const categoryIdToGroup = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories.length > 0 ? categories : []) {
      const gid = (c as any).groupId ?? (/kids/i.test(c.id) ? 'kids' : 'regular');
      map.set(c.id, gid);
    }
    if (map.size === 0) {
      // Fallback: infer from id when categories collection missing
      for (const it of items) {
        const gid = /kids/i.test(it.categoryId) ? 'kids' : 'regular';
        if (!map.has(it.categoryId)) map.set(it.categoryId, gid);
      }
    }
    return map;
  }, [categories, items]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const gid = categoryIdToGroup.get(it.categoryId) ?? 'regular';
      const byGroup = category === 'all' ? true : gid === category;
      const bySearch = query.trim() ? it.name.toLowerCase().includes(query.toLowerCase()) : true;
      return byGroup && bySearch;
    });
  }, [items, query, category, categoryIdToGroup]);

  const effectiveCategories = useMemo(() => {
    if (categories.length > 0) return categories;
    const ids = Array.from(new Set(items.map(i => i.categoryId)));
    // Fallback if no categories collection exists
    return ids.map((id) => ({ id, name: id, displayOrder: 9999, active: true } as CategoryRecord));
  }, [categories, items]);

  // Derive groups from categories. Prefer explicit groupId/groupName. Fallback infers from id containing 'kids'.
  const groups = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    const seen = new Set<string>();
    for (const c of effectiveCategories) {
      const gid = (c as any).groupId ?? (/kids/i.test(c.id) ? 'kids' : 'regular');
      const gname = (c as any).groupName ?? (gid === 'kids' ? 'Yerros Kids' : 'Yerros Regular');
      if (!seen.has(gid)) {
        seen.add(gid);
        list.push({ id: gid, name: gname });
      }
    }
    // Sort predictable: regular first, then kids
    return list.sort((a, b) => (a.id === 'regular' ? -1 : a.id.localeCompare(b.id)));
  }, [effectiveCategories]);

  // Build rows: one row per top-level group (e.g., Yerros Regular, Yerros Kids), items aggregated from its subcategories
  const groupRows = useMemo(() => {
    const activeGroups = category === 'all' ? groups.map(g => g.id) : [category];
    return activeGroups.map((gid) => {
      const gname = groups.find(g => g.id === gid)?.name ?? gid;
      const itemsInGroup = filtered.filter((it) => (categoryIdToGroup.get(it.categoryId) ?? 'regular') === gid);
      return { id: gid, name: gname, items: itemsInGroup };
    }).filter(row => row.items.length > 0);
  }, [groups, category, filtered, categoryIdToGroup]);

  // Each section creates its own scrollX for animation

  const addToCart = (item?: any) => {
    if (!canOrder) {
      toast.show("We’re closed at the moment.");
      return;
    }
    // Navigate to detail for customization before adding
    navigation.navigate('ItemDetail', { ...item, initialSelections: item?.defaultSelections });
  };

  if (loadingStore || loadingItems || loadingCategories) {
    return (
      <SafeAreaView style={{ flex:1, alignItems:"center", justifyContent:"center", backgroundColor:"#F8FAFC" }}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!store) {
    return (
      <SafeAreaView style={{ flex:1, alignItems:"center", justifyContent:"center", padding:20 }}>
        <Text style={{ fontWeight:"800", fontSize:18 }}>Store not found</Text>
        <Text style={{ color:"#6b7280", marginTop:8, textAlign:"center" }}>
          Ensure /stores/MAIN exists and rules allow reads.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      
      {/* Header (web only) */}
      {Platform.OS === 'web' && (
      <Animated.View style={{ opacity: headerOpacity }}>
        <LinearGradient
          colors={theme.gradients.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingBottom: 16, borderBottomWidth: 1, borderColor: "#475569", marginBottom: 8 }}
        >
          <Animated.View
            style={{
              paddingHorizontal: 20,
              // Web header sits flush to top
              paddingTop: 12,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Shop Info Row */}
            {Platform.OS === 'web' ? (
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "white", fontWeight: "900", fontSize: 24 }}>
                    {store.name}
                  </Text>
                  <Text style={{ color: theme.colors.onDark, fontSize: 14, marginTop: 2 }} numberOfLines={1}>
                    {store.address || "Authentic Greek Street Food"}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 6 }}>
                    <Badge text={open ? "Open now" : "Closed"} tone={open ? "green" : "red"} />
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Ionicons name="time" size={14} color="#FFFFFF" />
                      <Text style={{ color: theme.colors.onDark, fontSize: 12 }}>
                        Pickup {store.pickup?.minLeadMinutes ?? 10}-{store.pickup?.maxLeadMinutes ?? 25} min
                      </Text>
                    </View>
                  </View>
                  {!!store.announcement && (
                    <Text style={{ color:"#fde68a", marginTop:6, fontWeight:"600" }}>
                      • {store.announcement}
                    </Text>
                  )}
                </View>
                {/* Action Buttons (web: right side, vertical) */}
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={{ gap: 6 }}>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                      <GlassButton 
                        icon={<Ionicons name="cart-outline" size={18} color={theme.colors.onDark} />} 
                        label="Cart"
                        badge={totalCount > 0 ? totalCount.toString() : undefined}
                        onPress={() => navigation.navigate('Cart')}
                        variant="plain"
                      />
                    </Animated.View>
                    <GlassButton icon={<Ionicons name="heart-outline" size={18} color={theme.colors.onDark} />} label="Fav" onPress={() => navigation.navigate('Favorites')} variant="plain" />
                    {isAuthed ? (
                      <GlassButton icon={<Ionicons name="person-circle-outline" size={18} color={theme.colors.onDark} />} label="Profile" onPress={() => navigation.navigate('Profile')} variant="plain" />
                    ) : (
                      <GlassButton icon={<Ionicons name="person-outline" size={18} color={theme.colors.onDark} />} label="Login" onPress={() => navigation.navigate('Login')} variant="plain" />
                    )}
                  </View>
                </View>
              </View>
            ) : (
              <View style={{ marginBottom: 18 }}>
                {/* Mobile: stack store info and actions */}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "white", fontWeight: "900", fontSize: 24 }}>
                    {store.name}
                  </Text>
                  <Text style={{ color: theme.colors.onDark, fontSize: 14, marginTop: 2 }} numberOfLines={1}>
                    {store.address || "Authentic Greek Street Food"}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 6 }}>
                    <Badge text={open ? "Open now" : "Closed"} tone={open ? "green" : "red"} />
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Ionicons name="time" size={14} color={theme.colors.onDark} />
                      <Text style={{ color: theme.colors.onDark, fontSize: 12 }}>
                        Pickup {store.pickup?.minLeadMinutes ?? 10}-{store.pickup?.maxLeadMinutes ?? 25} min
                      </Text>
                    </View>
                  </View>
                  {!!store.announcement && (
                    <Text style={{ color:"#fde68a", marginTop:8, fontWeight:"600" }}>
                      • {store.announcement}
                    </Text>
                  )}
                </View>
                {/* Action Buttons (mobile: below, vertical) */}
                <View style={{ marginTop: 10 }}>
                  <View style={{ gap: 6 }}>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                      <GlassButton 
                        icon={<Ionicons name="cart-outline" size={18} color={theme.colors.onDark} />} 
                        label="Cart"
                        badge={totalCount > 0 ? totalCount.toString() : undefined}
                        onPress={() => navigation.navigate('Cart')}
                        variant="plain"
                      />
                    </Animated.View>
                    <GlassButton icon={<Ionicons name="heart-outline" size={18} color={theme.colors.onDark} />} label="Fav" onPress={() => navigation.navigate('Favorites')} variant="plain" />
                    {isAuthed ? (
                      <GlassButton icon={<Ionicons name="person-circle-outline" size={18} color={theme.colors.onDark} />} label="Profile" onPress={() => navigation.navigate('Profile')} variant="plain" />
                    ) : (
                      <GlassButton icon={<Ionicons name="person-outline" size={18} color={theme.colors.onDark} />} label="Login" onPress={() => navigation.navigate('Login')} variant="plain" />
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Search + Filter (web: stays in header) */}
            {Platform.OS === 'web' && (
              <>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                  <View style={[enhancedGlass(), { flex: 1 }]}>
                    <Ionicons name="search" size={18} color={theme.colors.muted} style={{ marginRight: 10 }} />
                    <TextInput
                      placeholder="Search delicious food..."
                      placeholderTextColor={theme.colors.muted}
                      value={query}
                      onChangeText={setQuery}
                      style={{ flex: 1, color: theme.colors.text, fontSize: 15 }}
                    />
                    {query.length > 0 && (
                      <TouchableOpacity onPress={() => setQuery("")}>
                        <Ionicons name="close-circle" size={18} color={theme.colors.muted} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowFilters(s => !s)}
                    style={[enhancedGlass({ paddingHorizontal: 14 }), { 
                      backgroundColor: showFilters ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.9)',
                      borderColor: showFilters ? '#334155' : '#D1D5DB'
                    }]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="filter" size={18} color={showFilters ? "#334155" : "#6B7280"} />
                      <Text style={{ color: showFilters ? '#334155' : '#374151', fontWeight: '700', fontSize: 13 }}>Filters</Text>
                    </View>
                  </TouchableOpacity>
                </View>
                {showFilters && (
                  <Animated.View style={{ marginTop: 16, opacity: showFilters ? 1 : 0 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: "row", gap: 10, paddingRight: 20 }}>
                        <EnhancedChip label="All" icon="restaurant" active={category === "all"} onPress={() => setCategory("all")} />
                        {groups.map((g) => (
                          <EnhancedChip
                            key={g.id}
                            label={g.name}
                            icon={g.id === 'kids' ? 'child-care' : 'restaurant'}
                            active={category === g.id}
                            onPress={() => setCategory(g.id)}
                          />
                        ))}
                      </View>
                    </ScrollView>
                  </Animated.View>
                )}
              </>
            )}
          </Animated.View>
        </LinearGradient>
      </Animated.View>
      )}

      {/* Mobile top section: store details, actions, search & filters */}
      {Platform.OS !== 'web' && (
        <View style={{ paddingHorizontal: 16, paddingTop: 4, backgroundColor: theme.colors.background }}>
          {/* Store details + actions in a clear card container */}
          <View style={{
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.card,
            borderRadius: 16,
            padding: 14,
            shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 3 }, shadowRadius: 10, elevation: 2,
          }}>
            {/* Store details */}
            <View>
              <Text style={{ color: theme.colors.text, fontWeight: '900', fontSize: 22 }}>{store.name}</Text>
              {!!store.address && (
                <Text style={{ color: theme.colors.muted, marginTop: 2 }} numberOfLines={1}>{store.address}</Text>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 }}>
                <Badge text={open ? 'Open now' : 'Closed'} tone={open ? 'green' : 'red'} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="time" size={14} color={theme.colors.muted} />
                  <Text style={{ color: theme.colors.muted, fontSize: 12 }}>
                    Pickup {store.pickup?.minLeadMinutes ?? 10}-{store.pickup?.maxLeadMinutes ?? 25} min
                  </Text>
                </View>
              </View>
              {!!store.announcement && (
                <Text style={{ color: '#92400E', marginTop: 6 }} numberOfLines={1}>• {store.announcement}</Text>
              )}
            </View>
            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <GlassButton 
                  variant="solid"
                  icon={<Ionicons name="cart-outline" size={18} color={'#fff'} />} 
                  label="Cart"
                  badge={totalCount > 0 ? totalCount.toString() : undefined}
                  onPress={() => navigation.navigate('Cart')}
                />
              </Animated.View>
              <GlassButton variant="solid" icon={<Ionicons name="heart-outline" size={18} color={'#fff'} />} label="Fav" onPress={() => navigation.navigate('Favorites')} />
              {isAuthed ? (
                <>
                  <GlassButton variant="solid" icon={<Ionicons name="person-circle-outline" size={18} color={'#fff'} />} label="Profile" onPress={() => navigation.navigate('Profile')} />
                </>
              ) : (
                <>
                  <GlassButton variant="solid" icon={<Ionicons name="person-outline" size={18} color={'#fff'} />} label="Login" onPress={() => navigation.navigate('Login')} />
                </>
              )}
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 10, marginBottom: 10 }}>
            <View style={[enhancedGlass(), { flex: 1, paddingVertical: 8 }]}>
              <Ionicons name="search" size={18} color={theme.colors.muted} style={{ marginRight: 10 }} />
              <TextInput
                placeholder="Search delicious food..."
                placeholderTextColor={theme.colors.muted}
                value={query}
                onChangeText={setQuery}
                style={{ flex: 1, color: theme.colors.text, fontSize: 15 }}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery("")}>
                  <Ionicons name="close-circle" size={18} color={theme.colors.muted} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setShowFilters(s => !s)}
              style={[enhancedGlass({ paddingHorizontal: 14 }), { 
                backgroundColor: showFilters ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: showFilters ? '#334155' : '#D1D5DB'
              }, { paddingVertical: 8 }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="filter" size={18} color={showFilters ? "#334155" : "#6B7280"} />
                <Text style={{ color: showFilters ? '#334155' : '#374151', fontWeight: '700', fontSize: 13 }}>Filters</Text>
              </View>
            </TouchableOpacity>
          </View>
          {showFilters && (
            <Animated.View style={{ marginTop: 10, opacity: showFilters ? 1 : 0 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 10, paddingVertical: 8 }}>
                  <EnhancedChip label="All" icon="restaurant" active={category === "all"} onPress={() => setCategory("all")} />
                  {groups.map((g) => (
                    <EnhancedChip
                      key={g.id}
                      label={g.name}
                      icon={g.id === 'kids' ? 'child-care' : 'restaurant'}
                      active={category === g.id}
                      onPress={() => setCategory(g.id)}
                    />
                  ))}
                </View>
              </ScrollView>
            </Animated.View>
          )}
        </View>
      )}

      {/* Spacer between header/top section and body */}
      <View style={{ height: 8 }} />


      {/* Body: horizontal rows per top-level group with compact cards */}
      {/* Closed banner */}
      {!canOrder && (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <View style={{ backgroundColor: '#FEF3C7', borderColor: '#F59E0B', borderWidth: 1, borderRadius: 12, padding: 12 }}>
            <Text style={{ color: '#92400E', fontWeight: '600' }}>We’re currently closed. Browsing only.</Text>
          </View>
        </View>
      )}

      <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} showsVerticalScrollIndicator={false}>
        {groupRows.length > 0 ? (
          <>
            {groupRows.map((row) => (
              <Section key={row.id} title={row.name}>
                <CarouselSection items={row.items} scrollX={new Animated.Value(0)} onAddToCart={addToCart} canOrder={canOrder} />
              </Section>
            ))}
          </>
        ) : (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <Ionicons name="search" size={48} color="#9CA3AF" />
            <Text style={{ color: "#6B7280", fontSize: 16, marginTop: 12 }}>
              Menu coming soon
            </Text>
            <Text style={{ color: "#9CA3AF", fontSize: 14, marginTop: 4, textAlign:"center", paddingHorizontal:24 }}>
              We’ve connected the store details. Next we’ll fetch real menu items.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
        <View style={{ 
          borderTopWidth: 1, 
          borderColor: "#E5E7EB", 
          backgroundColor: "white",
          paddingVertical: 12,
          paddingHorizontal: 20
        }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: "#6B7280", fontSize: 12 }}>
            © {new Date().getFullYear()} {store.name}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {/* Our Team button */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Team')}
              style={{ 
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#D1D5DB",
                backgroundColor: "#F9FAFB",
                marginRight: 12
              }}
            >
              <Ionicons name="people-outline" size={16} color="#374151" />
              <Text style={{ marginLeft: 6, color: "#374151", fontWeight: "700", fontSize: 12 }}>
                Our Team
              </Text>
            </TouchableOpacity>

            {/* Socials */}
            {!!store.social?.instagram && (
              <TouchableOpacity onPress={() => Linking.openURL(store.social!.instagram!)} style={{ marginHorizontal: 8 }}>
                <Ionicons name="logo-instagram" size={18} color="#E91E63" />
              </TouchableOpacity>
            )}
            {!!store.social?.facebook && (
              <TouchableOpacity onPress={() => Linking.openURL(store.social!.facebook!)} style={{ marginHorizontal: 8 }}>
                <Ionicons name="logo-facebook" size={18} color="#1877F2" />
              </TouchableOpacity>
            )}
            {!!store.social?.tiktok && store.social?.tiktok !== "" && (
              <TouchableOpacity onPress={() => Linking.openURL(store.social!.tiktok!)} style={{ marginLeft: 8 }}>
                <Ionicons name="logo-tiktok" size={18} color="#111827" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ---------- UI Bits ---------- */

function Badge({ text, tone }: { text: string; tone: "green" | "red" }) {
  const colors = {
    green: { bg: "#10B981", fg: "white", border: "#059669" },
    red: { bg: "#EF4444", fg: "white", border: "#DC2626" }
  };
  const { bg, fg, border } = colors[tone];
  
  return (
    <View style={{
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: bg,
      borderWidth: 1,
      borderColor: border,
    }}>
      <Text style={{ color: fg, fontWeight: "700", fontSize: 11 }}>{text}</Text>
    </View>
  );
}

function GlassButton({ icon, label, badge, onPress, variant }: { icon: React.ReactNode; label: string; badge?: string; onPress?: () => void; variant?: 'glass'|'solid'|'plain' }) {
  const isSolid = variant === 'solid';
  const isPlain = variant === 'plain';
  return (
    <TouchableOpacity onPress={onPress} style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: isPlain ? 0 : 12,
      paddingVertical: isPlain ? 0 : 8,
      borderRadius: isPlain ? 0 : 12,
      borderWidth: isPlain ? 0 : 1,
      borderColor: isPlain ? 'transparent' : (isSolid ? '#1f2937' : "rgba(255, 255, 255, 0.3)"),
      backgroundColor: isPlain ? 'transparent' : (isSolid ? '#111827' : "rgba(255, 255, 255, 0.2)"),
      position: "relative",
    }}>
      {icon}
      <Text style={{ color: isSolid || isPlain ? '#fff' : "white", fontWeight: isPlain ? '700' : "600", fontSize: 12 }}>{label}</Text>
      {badge && (
        <View style={{
          position: "absolute",
          top: isPlain ? -6 : -4,
          right: isPlain ? -10 : -4,
          backgroundColor: theme.colors.danger,
          borderRadius: 10,
          minWidth: 18,
          height: 18,
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Text style={{ color: "white", fontSize: 10, fontWeight: "800" }}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function EnhancedChip({ label, icon, active, onPress }: { 
  label: string; 
  icon: string; 
  active?: boolean; 
  onPress?: () => void 
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1.5,
        // Beige active state for selected filter
        borderColor: active ? '#D6C7A1' : theme.colors.border,
        backgroundColor: active ? 'rgba(214, 199, 161, 0.20)' : 'rgba(255, 255, 255, 0.9)',
      }}
    >
      <MaterialIcons name={icon as any} size={16} color={active ? '#FFFFFF' : theme.colors.muted} />
      <Text style={{ color: active ? '#FFFFFF' : "#374151", fontWeight: "700", fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  );
}

function enhancedGlass(extra?: { paddingHorizontal?: number }) {
  return {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: extra?.paddingHorizontal ?? 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  };
}

function CarouselSection({ items, scrollX, onAddToCart, canOrder }: { 
  items: any[]; 
  scrollX: Animated.Value; 
  onAddToCart: (item?: any) => void;
  canOrder: boolean;
}) {
  return (
    <Animated.FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={items}
      keyExtractor={(it) => it.id}
      contentContainerStyle={{ paddingHorizontal: 20 }}
      ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: true }
      )}
      renderItem={({ item, index }) => (
        <EnhancedCard
          item={item}
          index={index}
          scrollX={scrollX}
          onAddToCart={onAddToCart}
          canOrder={canOrder}
        />
      )}
    />
  );
}

function EnhancedCard({ item, index, scrollX, onAddToCart, canOrder }: { 
  item: any; 
  index: number; 
  scrollX: Animated.Value;
  onAddToCart: (item?: any) => void;
  canOrder: boolean;
}) {
  const inputRange = [(index - 1) * (CARD_W + 16), index * (CARD_W + 16), (index + 1) * (CARD_W + 16)];
  const scale = scrollX.interpolate({ inputRange, outputRange: [0.9, 1, 0.9], extrapolate: "clamp" });
  const opacity = scrollX.interpolate({ inputRange, outputRange: [0.8, 1, 0.8], extrapolate: "clamp" });

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Drive-aware image candidates with graceful fallback
  const candidates = useMemo(() => buildImageCandidates(item?.img), [item?.img]);
  const [srcIndex, setSrcIndex] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);
  const currentSrc = !imgFailed && candidates[srcIndex];
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(item?.name ?? 'Item')}&background=475569&color=fff&size=512&bold=true`;

  return (
    <Animated.View style={[{
      width: CARD_W,
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      opacity,
      transform: [{ scale }],
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 12,
      elevation: 4,
    }]}>
      {/* Image with overlay price badge */}
      <TouchableOpacity onPress={() => navigation.navigate('ItemDetail', { ...item, initialSelections: item?.defaultSelections })}>
        <View>
          {currentSrc ? (
            <Image
              source={{ uri: currentSrc }}
              style={{ width: "100%", height: IMG_H }}
              resizeMode="cover"
              onError={() => {
                if (srcIndex + 1 < candidates.length) setSrcIndex(srcIndex + 1);
                else setImgFailed(true);
              }}
            />
          ) : (
            <Image
              source={{ uri: fallback }}
              style={{ width: "100%", height: IMG_H }}
              resizeMode="cover"
            />
          )}
          <LinearGradient
            colors={theme.gradients.imageOverlay}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 40 }}
          />
          <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(17,24,39,0.85)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 10 }}>
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 12 }}>${item.price.toFixed(2)}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Simple Content */}
      <View style={{ padding: 12 }}>
        <TouchableOpacity onPress={() => navigation.navigate('ItemDetail', { ...item, initialSelections: item?.defaultSelections })}>
          <Text numberOfLines={1} style={{ color: theme.colors.text, fontWeight: "800", fontSize: 14 }}>
            {item.name}
          </Text>
        </TouchableOpacity>
        {!!item.description && (
          <Text numberOfLines={1} style={{ color: theme.colors.muted, fontSize: 12, marginTop: 4 }}>
            {item.description}
          </Text>
        )}

        {/* Compact Add button */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <TouchableOpacity
            disabled={!canOrder}
            onPress={() => onAddToCart(item)}
            style={{
              marginTop: 10,
              backgroundColor: canOrder ? theme.colors.primary : '#9ca3af',
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: "white", fontWeight: "700", fontSize: 12 }}>{canOrder ? 'Add' : 'Closed'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

function Section({ title, subtitle, children }: { 
  title: string; 
  subtitle?: string; 
  children?: React.ReactNode 
}) {
  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <Text style={{ color: theme.colors.text, fontWeight: "800", fontSize: 20 }}>{title}</Text>
        {subtitle && (
          <Text style={{ color: theme.colors.muted, fontSize: 14, marginTop: 4 }}>{subtitle}</Text>
        )}
      </View>
      {children ?? null}
    </View>
  );
}
