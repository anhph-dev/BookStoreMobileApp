import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, Pressable, View, Modal, FlatList, Switch } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Controller, useForm } from 'react-hook-form';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { COLORS, FONTS, SHADOWS, SIZES } from '../../constants/theme';
import { useServices } from '../../hooks/useServices';
import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';

export default function ProductFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { productService } = useServices();
  const [image, setImage] = useState(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const productId = route.params?.productId;
  const isEdit = Boolean(productId);

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: () => productService.getCategories() });
  const productQuery = useQuery({ queryKey: ['admin-product', productId], queryFn: () => productService.getProductById(productId), enabled: isEdit });

  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({ 
    defaultValues: { 
      productName: '', author: '', publisher: '', price: '', 
      originalPrice: '', discountPercent: '', stock: '', isbn: '', 
      shortDescription: '', description: '', categoryId: '',
      isAvailable: true, isFeatured: false, isNewArrival: false, isBestSeller: false // Thêm đủ 4 trường trạng thái
    } 
  });

  const selectedCategoryId = watch('categoryId');
  const categories = categoriesQuery.data || [];
  const selectedCategoryName = categories.find(c => String(c.CategoryId) === String(selectedCategoryId))?.CategoryName || 'Chọn danh mục sản phẩm';

  useEffect(() => {
    if (productQuery.data) {
      const product = productQuery.data;
      reset({
        productName: product.ProductName || '',
        author: product.Author || '',
        publisher: product.Publisher || '',
        price: String(product.Price || ''),
        originalPrice: String(product.OriginalPrice || ''),
        discountPercent: String(product.DiscountPercent || ''),
        stock: String(product.Stock || ''),
        isbn: product.ISBN || '',
        shortDescription: product.ShortDescription || '',
        description: product.Description || '',
        categoryId: String(product.CategoryId || ''),
        isAvailable: product.IsAvailable ?? true,
        isFeatured: product.IsFeatured ?? false,
        isNewArrival: product.IsNewArrival ?? false,
        isBestSeller: product.IsBestSeller ?? false,
      });
    }
  }, [productQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (formData) => (isEdit ? productService.updateProduct(productId, formData) : productService.createProduct(formData)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      Toast.show({ type: 'success', text1: isEdit ? 'Cập nhật thành công' : 'Thêm sản phẩm thành công' });
      navigation.goBack();
    },
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.8 });
    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const onSubmit = async (values) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.append(key, value ?? ''));

    if (image) {
      formData.append('image', { uri: image.uri, name: image.fileName || 'image.jpg', type: image.mimeType || 'image/jpeg' });
    }
    mutation.mutate(formData);
  };

  // Hàm tiện ích: Chỉ cho phép ký tự số, loại bỏ hoàn toàn chữ và ký tự đặc biệt
  const handleNumericChange = (text, onChange) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    onChange(cleaned);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={styles.title}>{isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}</Text>
      <Pressable onPress={pickImage} style={styles.imageBox}>
        {image || productQuery.data?.ImageUrl ? <Image source={{ uri: image?.uri || productQuery.data?.ImageUrl }} style={styles.image} /> : <><Ionicons name="camera-outline" size={36} color={COLORS.gray} /><Text style={styles.imageText}>Chọn ảnh</Text></>}
      </Pressable>

      <Controller control={control} name="productName" rules={{ required: 'Tên sách không được để trống' }} render={({ field }) => <AppInput label="Tên sách" value={field.value} onChangeText={field.onChange} error={errors.productName?.message} />} />
      
      <View style={{ gap: 6 }}>
        <Text style={styles.label}>Danh mục *</Text>
        <Pressable style={styles.pickerButton} onPress={() => setCategoryModalVisible(true)}>
          <Text style={[styles.pickerText, selectedCategoryId ? styles.darkText : styles.grayText]}>
            {selectedCategoryName}
          </Text>
          <Ionicons name="chevron-down-outline" size={20} color={COLORS.gray} />
        </Pressable>
      </View>

      <Controller control={control} name="author" render={({ field }) => <AppInput label="Tác giả" value={field.value} onChangeText={field.onChange} />} />
      <Controller control={control} name="publisher" render={({ field }) => <AppInput label="NXB" value={field.value} onChangeText={field.onChange} />} />
      <Controller control={control} name="isbn" render={({ field }) => <AppInput label="ISBN" value={field.value} onChangeText={field.onChange} />} />
      
      {/* Các trường nhập Số - Áp dụng cấu hình chặn chữ */}
      <Controller control={control} name="price" rules={{ required: 'Giá bán bắt buộc nhập' }} render={({ field }) => <AppInput label="Giá bán *" value={field.value} onChangeText={(text) => handleNumericChange(text, field.onChange)} keyboardType="numeric" error={errors.price?.message} />} />
      <Controller control={control} name="originalPrice" render={({ field }) => <AppInput label="Giá gốc" value={field.value} onChangeText={(text) => handleNumericChange(text, field.onChange)} keyboardType="numeric" />} />
      <Controller control={control} name="discountPercent" render={({ field }) => <AppInput label="% Giảm giá" value={field.value} onChangeText={(text) => handleNumericChange(text, field.onChange)} keyboardType="numeric" />} />
      <Controller control={control} name="stock" rules={{ required: 'Số lượng tồn kho bắt buộc nhập' }} render={({ field }) => <AppInput label="Tồn kho *" value={field.value} onChangeText={(text) => handleNumericChange(text, field.onChange)} keyboardType="numeric" error={errors.stock?.message} />} />
      
      <Controller control={control} name="shortDescription" render={({ field }) => <AppInput label="Mô tả ngắn" value={field.value} onChangeText={field.onChange} multiline numberOfLines={3} />} />
      <Controller control={control} name="description" render={({ field }) => <AppInput label="Mô tả đầy đủ" value={field.value} onChangeText={field.onChange} multiline numberOfLines={5} />} />

      {/* KHU VỰC CÁC TRƯỜNG TRẠNG THÁI (SWITCHES) */}
      <View style={styles.switchContainer}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Kích hoạt bán (Còn hàng)</Text>
          <Controller control={control} name="isAvailable" render={({ field }) => <Switch value={field.value} onValueChange={field.onChange} trackColor={{ true: COLORS.primary }} />} />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Sản phẩm nổi bật</Text>
          <Controller control={control} name="isFeatured" render={({ field }) => <Switch value={field.value} onValueChange={field.onChange} trackColor={{ true: COLORS.primary }} />} />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Hàng mới về</Text>
          <Controller control={control} name="isNewArrival" render={({ field }) => <Switch value={field.value} onValueChange={field.onChange} trackColor={{ true: COLORS.primary }} />} />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Sách bán chạy</Text>
          <Controller control={control} name="isBestSeller" render={({ field }) => <Switch value={field.value} onValueChange={field.onChange} trackColor={{ true: COLORS.primary }} />} />
        </View>
      </View>

      <AppButton label="Lưu sản phẩm" onPress={handleSubmit(onSubmit)} loading={mutation.isPending} fullWidth />

      {/* Modal danh mục */}
      <Modal visible={categoryModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn danh mục</Text>
              <Pressable onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close-outline" size={24} color={COLORS.dark} />
              </Pressable>
            </View>
            <FlatList
              data={categories}
              keyExtractor={(item) => String(item.CategoryId)}
              renderItem={({ item }) => (
                <Pressable 
                  style={styles.categoryItem} 
                  onPress={() => {
                    setValue('categoryId', String(item.CategoryId));
                    setCategoryModalVisible(false);
                  }}
                >
                  <Text style={[styles.categoryItemText, String(item.CategoryId) === String(selectedCategoryId) && styles.selectedCategoryText]}>
                    {item.CategoryName}
                  </Text>
                  {String(item.CategoryId) === String(selectedCategoryId) && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  )}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  title: { fontFamily: FONTS.displayBold, fontSize: 20, color: COLORS.dark },
  imageBox: { height: 160, borderRadius: SIZES.radius, backgroundColor: COLORS.grayLight, alignItems: 'center', justifyContent: 'center', gap: 8, ...SHADOWS.sm, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  imageText: { fontFamily: FONTS.medium, color: COLORS.gray },
  label: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.dark },
  pickerButton: { height: 50, borderRadius: SIZES.radius, backgroundColor: COLORS.grayLight, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  pickerText: { fontFamily: FONTS.regular, fontSize: 14, flex: 1 },
  darkText: { color: COLORS.dark },
  grayText: { color: COLORS.gray },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%', padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.dark },
  categoryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  categoryItemText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.dark },
  selectedCategoryText: { fontFamily: FONTS.medium, color: COLORS.primary },
  switchContainer: { padding: 12, backgroundColor: COLORS.grayLight, borderRadius: SIZES.radius, gap: 10, marginTop: 4 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  switchLabel: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.dark },
});