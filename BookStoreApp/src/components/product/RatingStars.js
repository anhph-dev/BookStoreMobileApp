import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

export default function RatingStars({ rating = 0, size = 16 }) {
  const stars = [];
  for (let index = 1; index <= 5; index += 1) {
    let name = 'star-outline';
    if (rating >= index) {
      name = 'star';
    } else if (rating >= index - 0.5) {
      name = 'star-half';
    }
    stars.push(<Ionicons key={index} name={name} size={size} color={COLORS.secondary} />);
  }
  return <View style={{ flexDirection: 'row', gap: 2 }}>{stars}</View>;
}
