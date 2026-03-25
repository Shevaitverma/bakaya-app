import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Theme } from '../constants/theme';
import { getCategoryIcon } from '../utils/categoryIcons';
import type { Expense } from '../types/expense';
import type { Category } from '../types/category';

const DELETE_BUTTON_WIDTH = 60;
const SWIPE_THRESHOLD = DELETE_BUTTON_WIDTH * 0.5;

interface SwipeableExpenseItemProps {
  item: Expense;
  index: number;
  isLastItem: boolean;
  onDelete: (expenseId: string) => void;
  onPress?: (expenseId: string) => void;
  formatDate: (dateString: string) => string;
  formatTime: (dateString: string) => string;
  formatAmount: (amount: number) => string;
  isOpen: boolean;
  onSwipeStart: () => void;
  onSwipeEnd: (expenseId: string, isOpen: boolean) => void;
  profileName?: string;
  profileColor?: string;
  categoryEmoji?: string;
  categoryColor?: string;
}

const SwipeableExpenseItem: React.FC<SwipeableExpenseItemProps> = ({
  item,
  index,
  isLastItem,
  onDelete,
  onPress,
  formatDate,
  formatTime,
  formatAmount,
  isOpen,
  onSwipeStart,
  onSwipeEnd,
  profileName,
  profileColor,
  categoryEmoji,
  categoryColor,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const startX = useRef(0);

  // Close when another item opens
  React.useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    if (!isOpen) {
      animation = Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      });
      animation.start();
    }

    return () => {
      animation?.stop();
    };
  }, [isOpen, translateX]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        // Notify parent that swipe started
        onSwipeStart();
        // Stop any ongoing animation and capture starting position
        translateX.stopAnimation((value) => {
          startX.current = value || 0;
        });
      },
      onPanResponderMove: (_, gestureState) => {
        const newValue = startX.current + gestureState.dx;

        // Clamp the value between -DELETE_BUTTON_WIDTH and 0
        const clampedValue = Math.max(-DELETE_BUTTON_WIDTH, Math.min(0, newValue));
        translateX.setValue(clampedValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        const finalValue = startX.current + gestureState.dx;

        // Detect tap: minimal movement and item is not swiped open
        const isTap = Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5;
        if (isTap && startX.current === 0 && onPress) {
          onPress(item._id);
          return;
        }

        if (finalValue < -SWIPE_THRESHOLD) {
          // Swipe threshold reached, snap to delete button position
          Animated.spring(translateX, {
            toValue: -DELETE_BUTTON_WIDTH,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }).start(() => {
            // Item is now open
            onSwipeEnd(item._id, true);
          });
        } else {
          // Snap back to original position
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }).start(() => {
            // Item is closed
            onSwipeEnd(item._id, false);
          });
        }
      },
    })
  ).current;

  const handleDelete = useCallback(() => {
    // Trigger delete immediately for better UX
    onDelete(item._id);

    // Snap back in the background
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start(() => {
      onSwipeEnd(item._id, false);
    });
  }, [item._id, onDelete, onSwipeEnd, translateX]);

  const categoryIcon = getCategoryIcon(item.category ?? 'other');
  const timelineCircleBg = categoryColor || Theme.colors.primary;

  return (
    <View style={styles.container}>
      {/* Delete button background */}
      <View style={styles.deleteButtonContainer}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.8}>
          <FontAwesome6
            name="trash"
            size={18}
            color={Theme.colors.textOnPrimary}
            solid
          />
        </TouchableOpacity>
      </View>

      {/* Swipeable content */}
      <Animated.View
        style={[
          styles.swipeableContent,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}>
        <View style={styles.expenseItem}>
          {/* Timeline line and icon container */}
          <View style={styles.timelineContainer}>
            <View style={styles.timelineIconWrapper}>
              <View style={[styles.timelineIconCircle, { backgroundColor: timelineCircleBg }]}>
                {categoryEmoji ? (
                  <Text style={styles.timelineEmoji}>{categoryEmoji}</Text>
                ) : (
                  <FontAwesome6
                    name={categoryIcon as any}
                    size={16}
                    color={Theme.colors.textOnPrimary}
                    solid
                  />
                )}
              </View>
              {!isLastItem && <View style={[styles.timelineLine, { backgroundColor: timelineCircleBg }]} />}
            </View>
          </View>

          {/* Expense content */}
          <View style={styles.expenseContent}>
            <View style={styles.expenseHeader}>
              <Text style={styles.expenseTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.expenseAmount, { color: item.type === 'income' ? Theme.colors.success : Theme.colors.error }]}>{formatAmount(item.amount)}</Text>
            </View>
            <View style={styles.expenseMetaRow}>
              <View style={styles.expenseDateTimeContainer}>
                <Text style={styles.expenseDate}>{formatDate(item.createdAt)}</Text>
                <Text style={styles.expenseTime}>{formatTime(item.createdAt)}</Text>
              </View>
              {profileName && profileColor && (
                <View style={[styles.profileBadge, { backgroundColor: profileColor + '18' }]}>
                  <View style={[styles.profileBadgeDot, { backgroundColor: profileColor }]} />
                  <Text style={[styles.profileBadgeText, { color: profileColor }]} numberOfLines={1}>
                    {profileName}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  deleteButtonContainer: {
    position: 'absolute',
    right: Theme.spacing.md,
    top: Theme.spacing.xs,
    bottom: Theme.spacing.xs,
    width: DELETE_BUTTON_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EF4444', // Red color
    borderRadius: Theme.borderRadius.md,
  },
  deleteButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  swipeableContent: {
    backgroundColor: Theme.colors.surface,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.sm + 4,
    minHeight: 44,
  },
  timelineContainer: {
    marginRight: Theme.spacing.md,
    width: 36,
    alignItems: 'center',
  },
  timelineIconWrapper: {
    alignItems: 'center',
    width: '100%',
    position: 'relative',
  },
  timelineIconCircle: {
    width: 36,
    height: 36,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timelineEmoji: {
    fontSize: 16,
  },
  timelineLine: {
    width: 2,
    position: 'absolute',
    top: 36,
    left: '50%',
    marginLeft: -1,
    height: '100%',
    minHeight: 44,
    backgroundColor: Theme.colors.primary,
  },
  expenseContent: {
    flex: 1,
    paddingTop: 4,
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 3,
  },
  expenseTitle: {
    flex: 1,
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
    letterSpacing: -0.2,
    marginRight: Theme.spacing.sm,
    lineHeight: 20,
  },
  expenseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    marginTop: 1,
    flexWrap: 'wrap',
  },
  expenseDateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs + 2,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Theme.borderRadius.round,
    gap: 3,
  },
  profileBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: Theme.borderRadius.round,
  },
  profileBadgeText: {
    fontSize: Theme.typography.fontSize.xs,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
    maxWidth: 70,
  },
  expenseDate: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
    lineHeight: 16,
  },
  expenseTime: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
    lineHeight: 16,
  },
  expenseAmount: {
    fontSize: Theme.typography.fontSize.medium,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
});

export default SwipeableExpenseItem;
