/**
 * Reusable EmojiPicker modal component
 * Displays a grid of emojis for selection in forms (e.g., category creation)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Animated,
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Theme } from '../constants/theme';

const EMOJI_OPTIONS = [
  '\u{1F37D}\uFE0F', '\u{1F374}', '\u{1F355}', '\u2615', '\u{1F6D2}', '\u{1F6CD}\uFE0F', '\u{1F455}', '\u{1F48A}', '\u{1F3E5}', '\u{1F393}',
  '\u{1F4DA}', '\u{1F697}', '\u{1F695}', '\u2708\uFE0F', '\u{1F68C}', '\u26FD', '\u{1F3E0}', '\u{1F511}', '\u{1F4A1}', '\u26A1',
  '\u{1F4F1}', '\u{1F4BB}', '\u{1F3AE}', '\u{1F3AC}', '\u{1F3B5}', '\u{1F381}', '\u{1F4B0}', '\u{1F4B3}', '\u{1F3E6}', '\u{1F4CA}',
  '\u{1F9FE}', '\u{1F4C4}', '\u{1F504}', '\u{1F6E1}\uFE0F', '\u{1F3CB}\uFE0F', '\u{1F487}', '\u{1F415}', '\u{1F33F}', '\u{1F37A}', '\u{1F389}',
  '\u2702\uFE0F', '\u{1F527}', '\u{1F9F9}', '\u{1F476}', '\u{1F48D}', '\u{1F4F8}', '\u{1F3A8}', '\u26BD', '\u{1F3D6}\uFE0F', '\u{1F6BF}',
  '\u{1F9F4}', '\u{1F9B7}', '\u{1F453}', '\u{1F392}', '\u{1F4E6}', '\u{1F69A}', '\u{1F3EA}', '\u{1F9F8}', '\u{1F4CC}', '\u{1F382}',
];

interface EmojiPickerProps {
  visible: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
  selectedEmoji?: string;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  visible,
  onSelect,
  onClose,
  selectedEmoji,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    if (visible) {
      animation = Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]);
      animation.start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }

    return () => {
      animation?.stop();
    };
  }, [visible, scaleAnim, opacityAnim]);

  const renderEmojiItem = ({ item }: { item: string }) => {
    const isSelected = selectedEmoji === item;
    return (
      <TouchableOpacity
        style={[styles.emojiCell, isSelected && styles.emojiCellSelected]}
        onPress={() => onSelect(item)}
        activeOpacity={0.7}>
        <Text style={styles.emojiText}>{item}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: opacityAnim },
          ]}
        />
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Pick an Emoji</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <FontAwesome6 name="xmark" size={18} color={Theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Emoji Grid */}
          <FlatList
            data={EMOJI_OPTIONS}
            renderItem={renderEmojiItem}
            keyExtractor={(item, index) => `${item}-${index}`}
            numColumns={6}
            contentContainerStyle={styles.gridContainer}
            columnWrapperStyle={styles.gridRow}
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  card: {
    width: '85%',
    maxWidth: 400,
    maxHeight: '70%',
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.lg,
    ...Theme.shadows.large,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  headerTitle: {
    fontSize: Theme.typography.fontSize.xlarge,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: Theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    paddingBottom: Theme.spacing.xs,
  },
  gridRow: {
    justifyContent: 'flex-start',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  emojiCell: {
    width: 48,
    height: 48,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
  },
  emojiCellSelected: {
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    backgroundColor: `${Theme.colors.primary}10`,
  },
  emojiText: {
    fontSize: 24,
  },
});

export default EmojiPicker;
