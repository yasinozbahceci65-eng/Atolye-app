import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, ScanLine, Save, Camera } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { supabase, Item, UnitType } from '@/lib/supabase';
import { useGuestGuard } from '@/lib/guest-guard';
import { useAuth } from '@/lib/auth-context';
import { offlineSync } from '@/lib/offline-sync';

const UNITS: UnitType[] = ['Litre', 'Adet', 'Metre', 'Kg', 'Kutu', 'm²'];

const TRADE_CATEGORIES = [
  { name: 'Boya', color: '#3B82F6' },
  { name: 'Seramik', color: '#F59E0B' },
  { name: 'Alçıpan', color: '#10B981' },
  { name: 'Laminat Parke', color: '#EF4444' },
  { name: 'Tesisat', color: '#06B6D4' },
  { name: 'Marangoz', color: '#8B5CF6' },
] as const;

export default function AddItemScreen() {
  const router = useRouter();
  const { requireAuth } = useGuestGuard();
  const { isGuest } = useAuth();
  const { barcode } = useLocalSearchParams<{ barcode?: string }>();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [unitType, setUnitType] = useState<UnitType>('Adet');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [barcodeValue, setBarcodeValue] = useState(barcode || '');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!requireAuth()) {
      router.back();
      return;
    }

  }, []);

  const save = async () => {
    if (!name.trim()) { Alert.alert('Uyarı', 'Lütfen malzeme adı girin'); return; }
    setSaving(true);
    try {
      if (isGuest) {
        const localItem: Item = {
          id: `local-item-${Date.now()}`,
          name: name.trim(),
          quantity: parseFloat(quantity) || 0,
          max_quantity: 100,
          unit_type: unitType,
          category_id: null,
          critical_level: 10,
          barcode_value: barcodeValue || null,
          image_url: null,
          notes: notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const cachedItems = await offlineSync.getCachedItems();
        await offlineSync.cacheItems([localItem, ...cachedItems]);
        router.back();
        return;
      }

      let categoryId: string | null = null;
      if (selectedCategory) {
        const category = TRADE_CATEGORIES.find(item => item.name === selectedCategory);
        if (!category) throw new Error('category_not_found');
        const { data: existingCategory, error: categoryError } = await supabase
          .from('categories')
          .select('id')
          .eq('name', category.name)
          .maybeSingle();
        if (categoryError) throw categoryError;
        if (existingCategory) {
          categoryId = existingCategory.id;
        } else {
          const { data: insertedCategory, error: insertCategoryError } = await supabase
            .from('categories')
            .insert({ name: category.name, color: category.color, icon: 'box' })
            .select('id')
            .maybeSingle();
          if (insertCategoryError) throw insertCategoryError;
          categoryId = insertedCategory?.id ?? null;
        }
      }

      const item: Item = {
        id: `local-item-${Date.now()}`,
        name: name.trim(),
        quantity: parseFloat(quantity) || 0,
        max_quantity: 100,
        unit_type: unitType,
        category_id: categoryId,
        critical_level: 10,
        barcode_value: barcodeValue || null,
        image_url: null,
        notes: notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('items').insert({
        name: item.name, quantity: item.quantity, max_quantity: item.max_quantity,
        unit_type: item.unit_type, category_id: item.category_id, critical_level: item.critical_level,
        barcode_value: item.barcode_value, notes: item.notes,
      });
      if (error) throw error;
      router.back();
    } catch {
      const cachedItems = await offlineSync.getCachedItems().catch(() => []);
      const fallbackItem: Item = {
        id: `local-item-${Date.now()}`,
        name: name.trim(),
        quantity: parseFloat(quantity) || 0,
        max_quantity: 100,
        unit_type: unitType,
        category_id: null,
        critical_level: 10,
        barcode_value: barcodeValue || null,
        image_url: null,
        notes: notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await offlineSync.cacheItems([fallbackItem, ...cachedItems]).catch(() => {});
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.white} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Malzeme</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Malzeme Adı *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Örn: Beyaz Duvar Boyası" />

          <Text style={styles.label}>Kategori</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <TouchableOpacity style={[styles.chip, !selectedCategory && styles.chipActive]} onPress={() => setSelectedCategory(null)}>
            <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>Kategorisiz</Text>
          </TouchableOpacity>
          {TRADE_CATEGORIES.map(category => (
            <TouchableOpacity
              key={category.name}
              style={[styles.chip, selectedCategory === category.name && styles.chipActive]}
              onPress={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}
            >
              <View style={[styles.chipDot, { backgroundColor: category.color }]} />
              <Text style={[styles.chipText, selectedCategory === category.name && styles.chipTextActive]}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Birim Tipi</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {UNITS.map(u => (
            <TouchableOpacity key={u} style={[styles.chip, unitType === u && styles.chipActive]} onPress={() => setUnitType(u)}>
              <Text style={[styles.chipText, unitType === u && styles.chipTextActive]}>{u}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Mevcut Miktar</Text>
        <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="numeric" />

        <Text style={styles.label}>Barkod / QR Kod</Text>
        <View style={styles.barcodeRow}>
          <TextInput style={[styles.input, { flex: 1 }]} value={barcodeValue} onChangeText={setBarcodeValue} placeholder="Barkod veya QR değeri" />
          <TouchableOpacity style={styles.scanBtn} onPress={() => router.push('/scanner')}>
            <ScanLine color={Colors.white} size={20} />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Notlar</Text>
        <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} placeholder="Eklemek istediğiniz notlar..." multiline numberOfLines={3} textAlignVertical="top" />

        <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color={Colors.white} /> : <>
            <Save color={Colors.white} size={20} />
            <Text style={styles.saveBtnText}>Malzeme Ekle</Text>
          </>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral50 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12, backgroundColor: Colors.primary,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: 'Inter-SemiBold', fontSize: 17, color: Colors.white },
  scroll: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingTop: 20, paddingBottom: 40 },
  label: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: Colors.neutral600, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.neutral800,
    borderWidth: 1, borderColor: Colors.neutral200,
  },
  textArea: { minHeight: 80, paddingTop: 12 },
  chipScroll: { maxHeight: 44 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.white, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.neutral200, marginRight: 8,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.neutral600 },
  chipTextActive: { color: Colors.white },
  barcodeRow: { flexDirection: 'row', gap: 10 },
  scanBtn: {
    width: 48, backgroundColor: Colors.primary, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  saveBtn: {
    flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24,
  },
  saveBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.white },
});
