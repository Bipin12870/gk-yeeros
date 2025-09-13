import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';
import { useFavorites } from '../../state/stores/useFavoritesStore';
import { useAuth } from '../auth/AuthProvider';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/AppNavigator';
import { getItem, type ItemRecord } from '../../data/repositories/ItemRepo';
import { getModifierGroupsByIds } from '../../data/repositories/ModifierRepo';

export default function FavoritesScreen() {
  const { items, remove } = useFavorites();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (!user) {
    return (
      <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding:20, backgroundColor: theme.colors.background }}>
        <Text style={{ fontSize:22, fontWeight:'800', color: theme.colors.text }}>Favorites</Text>
        <Text style={{ color: theme.colors.muted, marginTop:8, textAlign:'center' }}>Please sign in to view and save your favorites.</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop:12, backgroundColor: theme.colors.primaryDark, paddingHorizontal:16, paddingVertical:10, borderRadius:10 }}>
          <Text style={{ color:'#fff', fontWeight:'700' }}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: theme.colors.background }}>
        <Text style={{ fontSize:22, fontWeight:'800', color: theme.colors.text }}>Favorites</Text>
        <Text style={{ color: theme.colors.muted, marginTop:8 }}>Your saved items will appear here.</Text>
      </View>
    );
  }
  return (
    <FlatList
      data={items}
      keyExtractor={(it) => it.id}
      contentContainerStyle={{ padding:16 }}
      ItemSeparatorComponent={() => <View style={{ height:12 }} />}
      renderItem={({ item }) => (
        <FavoriteRow
          id={item.id}
          name={item.name}
          img={item.img}
          selections={item.selections}
          onRemove={() => remove(item.id)}
        />
      )}
    />
  );
}

function FavoriteRow({ id, name, img, selections, onRemove }: {
  id: string;
  name: string;
  img?: string;
  selections?: { groupId: string; optionIds: string[] }[];
  onRemove: () => void;
}) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [item, setItem] = useState<ItemRecord | null>(null);
  const [prefText, setPrefText] = useState<string>('');

  useEffect(() => {
    (async () => {
      const rec = await getItem('MAIN', id);
      setItem(rec);
      if (rec && selections && selections.length > 0 && rec.modifierGroupIds && rec.modifierGroupIds.length > 0) {
        const groups = await getModifierGroupsByIds('MAIN', rec.modifierGroupIds);
        const parts: string[] = [];
        for (const sel of selections) {
          const g = groups.find((x) => x.id === sel.groupId);
          if (!g) continue;
          const names = sel.optionIds
            .map((oid) => g.options.find((o) => o.id === oid)?.name)
            .filter(Boolean) as string[];
          if (names.length) parts.push(`${g.name}: ${names.join(', ')}`);
        }
        setPrefText(parts.join(' · '));
      } else {
        setPrefText('');
      }
    })();
  }, [id]);

  return (
    <View style={{ gap:8, padding:12, borderWidth:1, borderColor: theme.colors.border, borderRadius:12, backgroundColor: theme.colors.card }}>
      <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
        {img ? (
          <Image source={{ uri: img }} style={{ width:64, height:64, borderRadius:8 }} />
        ) : (
          <View style={{ width:64, height:64, borderRadius:8, backgroundColor:'#f3f4f6' }} />
        )}
        <View style={{ flex:1 }}>
          <Text style={{ fontWeight:'800', fontSize:16, color: theme.colors.text }}>{name}</Text>
          {prefText ? (
            <Text style={{ color: theme.colors.muted, marginTop:4 }} numberOfLines={2}>{prefText}</Text>
          ) : (
            selections && selections.length > 0 ? (
              <Text style={{ color: theme.colors.muted, marginTop:4 }} numberOfLines={1}>
                {selections.length} preference{selections.length > 1 ? 's' : ''} saved
              </Text>
            ) : null
          )}
        </View>
      </View>
      <View style={{ flexDirection:'row', justifyContent:'flex-end', gap:8 }}>
        <TouchableOpacity
          onPress={() => {
            if (!item) return;
            navigation.navigate('ItemDetail', {
              id: item.id,
              name: item.name,
              img: item.img,
              price: item.price,
              modifierGroupIds: item.modifierGroupIds,
              initialSelections: selections ? Object.fromEntries(selections.map(s => [s.groupId, s.optionIds])) : undefined,
            });
          }}
          style={{ paddingHorizontal:12, paddingVertical:8, borderRadius:8, backgroundColor: theme.colors.primaryMutedBg }}
        >
          <Text style={{ color: theme.colors.primaryDark, fontWeight:'800' }}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onRemove} style={{ paddingHorizontal:12, paddingVertical:8, borderRadius:8, backgroundColor: theme.colors.destructiveBg }}>
          <Text style={{ color: theme.colors.destructiveText, fontWeight:'800' }}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
