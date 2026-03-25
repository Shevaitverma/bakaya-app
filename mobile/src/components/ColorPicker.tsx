/**
 * Reusable ColorPicker component
 * Renders an inline grid of color swatches for selection in forms (e.g., category creation)
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Theme } from '../constants/theme';

const DEFAULT_COLORS = [
  '#D81B60', '#E53935', '#F4511E', '#FB8C00', '#FFB300',
  '#FDD835', '#7CB342', '#43A047', '#00897B', '#00ACC1',
  '#039BE5', '#1E88E5', '#3949AB', '#5E35B1', '#8E24AA',
  '#6D4C41', '#546E7A', '#78909C', '#EC407A', '#AB47BC',
];

interface ColorPickerProps {
  selectedColor: string;
  onSelect: (color: string) => void;
  colors?: string[];
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onSelect,
  colors = DEFAULT_COLORS,
}) => {
  return (
    <View style={styles.container}>
      {colors.map((color) => {
        const isSelected = selectedColor === color;
        return (
          <TouchableOpacity
            key={color}
            style={[
              styles.swatch,
              { backgroundColor: color },
              isSelected && styles.swatchSelected,
              isSelected && { borderColor: color },
            ]}
            onPress={() => onSelect(color)}
            activeOpacity={0.7}
            accessibilityLabel={`Select color ${color}`}
            accessibilityRole="button">
            {isSelected && (
              <FontAwesome6 name="check" size={16} color={Theme.colors.white} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: Theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: Theme.colors.white,
    ...Theme.shadows.small,
  },
});

export default ColorPicker;
