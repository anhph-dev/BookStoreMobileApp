import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
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

  const productId = route.params?.productId;
  const isEdit = Boolean(productId);

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: () => productService.getCategories() });
  const productQuery = useQuery({ queryKey: ['admin-product', productId], queryFn: () => productService.getProductById(productId), enabled: isEdit });

  const { control, handleSubmit, reset } = useForm({ defaultValues: { productName: '', author: '', publisher: '', price: '', originalPrice: '', discountPercent: '', stock: '', isbn: '', shortDescription: '', description: '' } });

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
      });
    }
  }, [productQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (formData) => (isEdit ? productService.updateProduct(productId, formData) : productService.createProduct(formData)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      Toast.show({ type: 'success', text1: isEdit ? 'Cập nhật thành công' : 'Thêm sản phẩm thành công' });
      navigation.goBack();
    },
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={styles.title}>{isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}</Text>
      <Pressable onPress={pickImage} style={styles.imageBox}>
        {image || productQuery.data?.ImageUrl ? <Image source={{ uri: image?.uri || productQuery.data?.ImageUrl }} style={styles.image} /> : <><Ionicons name="camera-outline" size={36} color={COLORS.gray} /><Text style={styles.imageText}>Chọn ảnh</Text></>}
      </Pressable>

      <Controller control={control} name="productName" rules={{ required: true }} render={({ field }) => <AppInput label="Tên sách" value={field.value} onChangeText={field.onChange} />} />
      <Controller control={control} name="author" render={({ field }) => <AppInput label="Tác giả" value={field.value} onChangeText={field.onChange} />} />
      <Controller control={control} name="publisher" render={({ field }) => <AppInput label="NXB" value={field.value} onChangeText={field.onChange} />} />
      <Controller control={control} name="isbn" render={({ field }) => <AppInput label="ISBN" value={field.value} onChangeText={field.onChange} />} />
      <Controller control={control} name="price" render={({ field }) => <AppInput label="Giá bán" value={field.value} onChangeText={field.onChange} keyboardType="numeric" />} />
      <Controller control={control} name="originalPrice" render={({ field }) => <AppInput label="Giá gốc" value={field.value} onChangeText={field.onChange} keyboardType="numeric" />} />
      <Controller control={control} name="discountPercent" render={({ field }) => <AppInput label="% Giảm giá" value={field.value} onChangeText={field.onChange} keyboardType="numeric" />} />
      <Controller control={control} name="stock" render={({ field }) => <AppInput label="Tồn kho" value={field.value} onChangeText={field.onChange} keyboardType="numeric" />} />
      <Controller control={control} name="shortDescription" render={({ field }) => <AppInput label="Mô tả ngắn" value={field.value} onChangeText={field.onChange} multiline numberOfLines={3} />} />
      <Controller control={control} name="description" render={({ field }) => <AppInput label="Mô tả đầy đủ" value={field.value} onChangeText={field.onChange} multiline numberOfLines={5} />} />

      <AppButton label="Lưu sản phẩm" onPress={handleSubmit(onSubmit)} loading={mutation.isPending} fullWidth />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  title: { fontFamily: FONTS.displayBold, fontSize: 20, color: COLORS.dark },
  imageBox: { height: 160, borderRadius: SIZES.radius, backgroundColor: COLORS.grayLight, alignItems: 'center', justifyContent: 'center', gap: 8, ...SHADOWS.sm, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  imageText: { fontFamily: FONTS.medium, color: COLORS.gray },
});
