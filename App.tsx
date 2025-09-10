// App.tsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  Animated,
  Platform,
  StatusBar,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const SHOP = {
  name: "Gk's Yerros",
  tagline: "Authentic Greek Street Food",
  rating: 4.8,
  deliveryTime: "20-35 min",
  hours: { 
    mon: ["10:00-20:00"], 
    tue: ["10:00-20:00"], 
    wed: ["10:00-20:00"], 
    thu: ["10:00-22:00"], 
    fri: ["10:00-23:00"], 
    sat: ["11:00-23:00"], 
    sun: ["11:00-21:00"] 
  }
};

const CATEGORIES = [
  { id: "all", label: "All", icon: "restaurant" },
  { id: "yerros_classics", label: "Classics", icon: "star" },
  { id: "wraps", label: "Wraps", icon: "nutrition" },
  { id: "plates", label: "Plates", icon: "restaurant-menu" },
];

const MOCK_ITEMS = Array.from({ length: 12 }).map((_, i) => ({
  id: `mock-${i + 1}`,
  name: i % 4 === 0 ? "Yerros Classic Wrap" : 
        i % 4 === 1 ? "Lamb Souvlaki Plate" : 
        i % 4 === 2 ? "Chicken Gyro Wrap" : "Falafel Mediterranean Bowl",
  description: i % 4 === 0 ? "Our signature wrap with premium ingredients and authentic Greek flavors" :
               i % 4 === 1 ? "Tender grilled lamb with tzatziki, pita, and fresh Greek salad" :
               i % 4 === 2 ? "Marinated chicken, fresh vegetables, and our house-made sauce" :
               "Fresh falafel with hummus, tabbouleh, and Mediterranean vegetables",
  price: 12.5 + (i % 4) * 2.5,
  originalPrice: i % 3 === 0 ? 14.5 + (i % 4) * 2.5 : null,
  categoryId: i % 4 === 0 ? "yerros_classics" : 
              i % 4 === 1 ? "plates" : 
              i % 4 === 2 ? "wraps" : "plates",
  img: i % 4 === 0 ? "https://images.unsplash.com/photo-1603048297172-c92544798c67?q=80&w=1200&auto=format&fit=crop" :
       i % 4 === 1 ? "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop" :
       i % 4 === 2 ? "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?q=80&w=1200&auto=format&fit=crop" :
       "https://images.unsplash.com/photo-1551782450-17144efb9c50?q=80&w=1200&auto=format&fit=crop",
  isPopular: i % 5 === 0,
  isNew: i % 7 === 0,
}));

function isOpenNow(hours?: Record<string, string[]>) {
  if (!hours) return false;
  const now = new Date();
  const dayKey = ["sun","mon","tue","wed","thu","fri","sat"][now.getDay()];
  const spans = hours[dayKey] || [];
  return spans.some(span => {
    const [start, end] = span.split("-");
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const s = new Date(now); s.setHours(sh, sm ?? 0, 0, 0);
    const e = new Date(now); e.setHours(eh, em ?? 0, 0, 0);
    return now >= s && now <= e;
  });
}

const screen = Dimensions.get("window").width;
const GUTTER = 20;
const CARD_W = Math.floor((screen - GUTTER * 2 - 20) / 2.1);
const IMG_H = 140;

export default function App() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  
  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animations
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

    // Pulse animation for cart when items added
    if (cartCount > 0) {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [cartCount]);

  const open = useMemo(() => isOpenNow(SHOP.hours), []);
  const filtered = useMemo(() => {
    return MOCK_ITEMS.filter((it) => {
      const byCat = category === "all" ? true : it.categoryId === category;
      const bySearch = query.trim() ? it.name.toLowerCase().includes(query.toLowerCase()) : true;
      return byCat && bySearch;
    });
  }, [query, category]);

  const classics = filtered.filter(i => i.categoryId === "yerros_classics");
  const wraps = filtered.filter(i => i.categoryId === "wraps");
  const plates = filtered.filter(i => i.categoryId === "plates");

  const scrollX1 = useRef(new Animated.Value(0)).current;
  const scrollX2 = useRef(new Animated.Value(0)).current;
  const scrollX3 = useRef(new Animated.Value(0)).current;

  const addToCart = () => {
    setCartCount(prev => prev + 1);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0B14" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0B14" />
      
      {/* Enhanced Gradient Header */}
      <Animated.View style={{ opacity: headerOpacity }}>
        <LinearGradient
          colors={["#1A1B2E", "#16213E", "#0F3460"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingBottom: 16, borderBottomWidth: 1, borderColor: "#2A3284" }}
        >
          <Animated.View 
            style={{ 
              paddingHorizontal: 20, 
              paddingTop: Platform.OS === "android" ? 25 : 10,
              transform: [{ translateY: slideAnim }]
            }}
          >
            {/* Shop Info Row */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "white", fontWeight: "900", fontSize: 24 }}>{SHOP.name}</Text>
                <Text style={{ color: "#94A3B8", fontSize: 14, marginTop: 2 }}>{SHOP.tagline}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 6 }}>
                  <Badge text={open ? "Open now" : "Closed"} tone={open ? "green" : "red"} />
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={{ color: "#F1F5F9", fontWeight: "600", fontSize: 12 }}>{SHOP.rating}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="time" size={14} color="#94A3B8" />
                    <Text style={{ color: "#94A3B8", fontSize: 12 }}>{SHOP.deliveryTime}</Text>
                  </View>
                </View>
              </View>
              
              {/* Action Buttons */}
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <GlassButton 
                    icon={<Ionicons name="cart-outline" size={18} color="#E2E8F0" />} 
                    label="Cart"
                    badge={cartCount > 0 ? cartCount.toString() : undefined}
                  />
                </Animated.View>
                <GlassButton icon={<Ionicons name="heart-outline" size={18} color="#E2E8F0" />} label="Saved" />
              </View>
            </View>

            {/* Enhanced Search + Filter */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <View style={[enhancedGlass(), { flex: 1 }]}>
                <Ionicons name="search" size={18} color="#64748B" style={{ marginRight: 10 }} />
                <TextInput
                  placeholder="Search delicious food..."
                  placeholderTextColor="#64748B"
                  value={query}
                  onChangeText={setQuery}
                  style={{ flex: 1, color: '#F1F5F9', fontSize: 15 }}
                />
                {query.length > 0 && (
                  <TouchableOpacity onPress={() => setQuery("")}>
                    <Ionicons name="close-circle" size={18} color="#64748B" />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                onPress={() => setShowFilters(s => !s)}
                style={[enhancedGlass({ paddingHorizontal: 16 }), { 
                  backgroundColor: showFilters ? 'rgba(59, 130, 246, 0.15)' : 'rgba(30, 41, 59, 0.8)',
                  borderColor: showFilters ? '#3B82F6' : '#475569'
                }]}
              >
                <MaterialIcons name="tune" size={18} color={showFilters ? "#60A5FA" : "#E2E8F0"} />
              </TouchableOpacity>
            </View>

            {/* Enhanced Filter Chips */}
            {showFilters && (
              <Animated.View
                style={{
                  marginTop: 16,
                  opacity: showFilters ? 1 : 0,
                }}
              >
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: 10, paddingRight: 20 }}>
                    {CATEGORIES.map(c => (
                      <EnhancedChip 
                        key={c.id} 
                        label={c.label} 
                        icon={c.icon}
                        active={category === c.id} 
                        onPress={() => setCategory(c.id)} 
                      />
                    ))}
                  </View>
                </ScrollView>
              </Animated.View>
            )}
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      {/* Enhanced Body */}
      <ScrollView style={{ flex: 1, backgroundColor: "#0A0B14" }} showsVerticalScrollIndicator={false}>
        {classics.length > 0 && (
          <Section title="🌟 Yerros Classics" subtitle="Our most beloved dishes">
            <CarouselSection items={classics} scrollX={scrollX1} onAddToCart={addToCart} />
          </Section>
        )}

        {wraps.length > 0 && (
          <Section title="🌯 Fresh Wraps" subtitle="Perfectly wrapped flavors">
            <CarouselSection items={wraps} scrollX={scrollX2} onAddToCart={addToCart} />
          </Section>
        )}

        {plates.length > 0 && (
          <Section title="🍽️ Hearty Plates" subtitle="Complete meal experiences">
            <CarouselSection items={plates} scrollX={scrollX3} onAddToCart={addToCart} />
          </Section>
        )}

        {filtered.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <Ionicons name="search" size={48} color="#475569" />
            <Text style={{ color: "#64748B", fontSize: 16, marginTop: 12 }}>No items found</Text>
            <Text style={{ color: "#475569", fontSize: 14, marginTop: 4 }}>Try adjusting your search or filters</Text>
          </View>
        )}
      </ScrollView>

      {/* Enhanced Footer */}
      <LinearGradient
        colors={["#0F172A", "#1E293B"]}
        style={{ borderTopWidth: 1, borderColor: "#334155" }}
      >
        <View style={{ alignItems: "center", gap: 12, paddingVertical: 20, paddingHorizontal: 20 }}>
          <Text style={{ color: "#F1F5F9", fontWeight: "800", fontSize: 16 }}>Connect with us</Text>
          <View style={{ flexDirection: "row", gap: 24 }}>
            <SocialLink label="Instagram" icon="logo-instagram" url="https://instagram.com" color="#E1306C" />
            <SocialLink label="Facebook" icon="logo-facebook" url="https://facebook.com" color="#1877F2" />
            <SocialLink label="Twitter" icon="logo-twitter" url="https://twitter.com" color="#1DA1F2" />
          </View>
          <Text style={{ color: "#64748B", fontSize: 12, marginTop: 8 }}>© {new Date().getFullYear()} Gk's Yerros - All rights reserved</Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

/* ---------- Enhanced Components ---------- */

function Badge({ text, tone }: { text: string; tone: "green" | "red" }) {
  const colors = {
    green: { bg: "#064E3B", fg: "#6EE7B7", border: "#059669" },
    red: { bg: "#7F1D1D", fg: "#FCA5A5", border: "#DC2626" }
  };
  const { bg, fg, border } = colors[tone];
  
  return (
    <View style={{
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: bg,
      borderWidth: 1,
      borderColor: border + "40",
    }}>
      <Text style={{ color: fg, fontWeight: "700", fontSize: 11 }}>{text}</Text>
    </View>
  );
}

function GlassButton({ icon, label, badge }: { icon: React.ReactNode; label: string; badge?: string }) {
  return (
    <TouchableOpacity style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#334155",
      backgroundColor: "rgba(30, 41, 59, 0.8)",
      position: "relative",
    }}>
      {icon}
      <Text style={{ color: "#E2E8F0", fontWeight: "600", fontSize: 12 }}>{label}</Text>
      {badge && (
        <View style={{
          position: "absolute",
          top: -4,
          right: -4,
          backgroundColor: "#EF4444",
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
        borderColor: active ? "#3B82F6" : "#475569",
        backgroundColor: active ? "rgba(59, 130, 246, 0.15)" : "rgba(30, 41, 59, 0.8)",
      }}
    >
      <MaterialIcons name={icon as any} size={16} color={active ? "#60A5FA" : "#94A3B8"} />
      <Text style={{ color: active ? "#DBEAFE" : "#E2E8F0", fontWeight: "700", fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  );
}

function SocialLink({ label, icon, url, color }: { label: string; icon: string; url: string; color: string }) {
  return (
    <TouchableOpacity 
      onPress={() => Linking.openURL(url)}
      style={{
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: "rgba(30, 41, 59, 0.6)",
        borderWidth: 1,
        borderColor: "#334155",
      }}
    >
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={{ color: "#94A3B8", fontSize: 11, fontWeight: "600" }}>{label}</Text>
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
    borderColor: '#475569',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  };
}

function CarouselSection({ items, scrollX, onAddToCart }: { 
  items: any[]; 
  scrollX: Animated.Value; 
  onAddToCart: () => void 
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
        />
      )}
    />
  );
}

function EnhancedCard({ item, index, scrollX, onAddToCart }: { 
  item: any; 
  index: number; 
  scrollX: Animated.Value;
  onAddToCart: () => void;
}) {
  const inputRange = [(index - 1) * (CARD_W + 16), index * (CARD_W + 16), (index + 1) * (CARD_W + 16)];
  const scale = scrollX.interpolate({ inputRange, outputRange: [0.9, 1, 0.9], extrapolate: "clamp" });
  const opacity = scrollX.interpolate({ inputRange, outputRange: [0.7, 1, 0.7], extrapolate: "clamp" });

  return (
    <Animated.View style={[{
      width: CARD_W,
      borderRadius: 20,
      overflow: "hidden",
      backgroundColor: "#1E293B",
      borderWidth: 1,
      borderColor: "#334155",
      opacity,
      transform: [{ scale }],
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 16,
      elevation: 8,
    }]}>
      {/* Image with overlays */}
      <View style={{ position: "relative" }}>
        <Image source={{ uri: item.img }} style={{ width: "100%", height: IMG_H }} resizeMode="cover" />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.3)"]}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40 }}
        />
        
        {/* Badges */}
        <View style={{ position: "absolute", top: 12, left: 12, flexDirection: "row", gap: 6 }}>
          {item.isPopular && (
            <View style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor: "#F59E0B",
            }}>
              <Text style={{ color: "white", fontWeight: "800", fontSize: 10 }}>POPULAR</Text>
            </View>
          )}
          {item.isNew && (
            <View style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor: "#10B981",
            }}>
              <Text style={{ color: "white", fontWeight: "800", fontSize: 10 }}>NEW</Text>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={{ padding: 16 }}>
        <Text numberOfLines={1} style={{ color: "#F1F5F9", fontWeight: "800", fontSize: 15 }}>
          {item.name}
        </Text>
        <Text style={{ marginTop: 6, color: "#94A3B8", fontSize: 12, lineHeight: 16 }} numberOfLines={2}>
          {item.description}
        </Text>
        
        {/* Price */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 }}>
          <Text style={{ color: "white", fontWeight: "900", fontSize: 18 }}>
            ${item.price.toFixed(2)}
          </Text>
          {item.originalPrice && (
            <Text style={{ 
              color: "#64748B", 
              fontSize: 14, 
              textDecorationLine: "line-through" 
            }}>
              ${item.originalPrice.toFixed(2)}
            </Text>
          )}
        </View>

        {/* Add Button */}
        <TouchableOpacity
          onPress={onAddToCart}
          style={{
            marginTop: 12,
            backgroundColor: "#3B82F6",
            paddingVertical: 12,
            borderRadius: 14,
            alignItems: "center",
            shadowColor: "#3B82F6",
            shadowOpacity: 0.3,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text style={{ color: "white", fontWeight: "800", fontSize: 14 }}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

function Section({ title, subtitle, children }: { 
  title: string; 
  subtitle?: string; 
  children: React.ReactNode 
}) {
  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <Text style={{ color: "#F1F5F9", fontWeight: "800", fontSize: 20 }}>{title}</Text>
        {subtitle && (
          <Text style={{ color: "#94A3B8", fontSize: 14, marginTop: 4 }}>{subtitle}</Text>
        )}
      </View>
      {children}
    </View>
  );
}