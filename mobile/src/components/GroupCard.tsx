import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Theme } from '../constants/theme';
import { formatCurrencyExact } from '../utils/currency';
import { GroupCardProps } from '../interfaces/groupCard';

// Color palette for member avatars — picked by hashing the name
const AVATAR_COLORS = [
  '#D81B60', '#E91E63', '#9C27B0', '#673AB7',
  '#3F51B5', '#2196F3', '#00BCD4', '#009688',
  '#4CAF50', '#FF9800', '#FF5722', '#795548',
];

const hashName = (name: string): number => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const getAvatarColor = (name: string): string => {
  return AVATAR_COLORS[hashName(name) % AVATAR_COLORS.length] ?? '#D81B60';
};

const GroupCard: React.FC<GroupCardProps> = ({
  title,
  amount,
  imageUri,
  onPress,
  memberCount,
  memberNames,
  totalExpenses,
}) => {
  const hasAmount = amount > 0;
  const amountColor = hasAmount ? Theme.colors.error : Theme.colors.success;

  // Determine icon based on title
  const getIconName = (): string => {
    if (title === 'My Expense') {
      return 'wallet';
    }
    return 'users';
  };

  // Determine label text based on title
  const getAmountLabel = (): string => {
    if (title === 'My Expense') {
      return 'Your expense';
    }
    return 'You owe';
  };

  // Determine background gradient color for icon container
  const getIconBackgroundColor = (): string => {
    if (title === 'My Expense') {
      return 'rgba(216, 27, 96, 0.1)'; // Primary color with opacity
    }
    return 'rgba(59, 130, 246, 0.1)'; // Blue color with opacity
  };

  const getIconColor = (): string => {
    if (title === 'My Expense') {
      return Theme.colors.primary;
    }
    return Theme.colors.blue;
  };

  // Determine display amount: prefer totalExpenses if provided
  const displayAmount = totalExpenses !== undefined ? totalExpenses : amount;

  // Build avatar list (max 3 visible)
  const visibleNames = memberNames ? memberNames.slice(0, 3) : [];
  const overflowCount = memberNames ? memberNames.length - 3 : 0;

  const CardContent = ({ pressed }: { pressed?: boolean }) => (
    <View style={[styles.card, pressed && styles.cardPressed]}>
      <View style={styles.imageContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: getIconBackgroundColor() }]}>
            <FontAwesome6
              name={getIconName() as any}
              size={22}
              color={getIconColor()}
              solid
            />
          </View>
        )}
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {visibleNames.length > 0 && (
          <View style={styles.avatarRow}>
            {visibleNames.map((name, idx) => (
              <View
                key={name + idx}
                style={[
                  styles.avatarCircle,
                  { backgroundColor: getAvatarColor(name) },
                  idx > 0 && { marginLeft: -8 },
                ]}
              >
                <Text style={styles.avatarText}>
                  {name.charAt(0).toUpperCase()}
                </Text>
              </View>
            ))}
            {overflowCount > 0 && (
              <View style={[styles.avatarCircle, styles.avatarOverflow, { marginLeft: -8 }]}>
                <Text style={styles.avatarOverflowText}>+{overflowCount}</Text>
              </View>
            )}
            {memberCount !== undefined && (
              <Text style={styles.memberCountText}>
                {memberCount} {memberCount === 1 ? 'member' : 'members'}
              </Text>
            )}
          </View>
        )}
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>
            {getAmountLabel()}
          </Text>
          <Text style={[styles.amount, { color: amountColor }]}>
            {formatCurrencyExact(displayAmount)}
          </Text>
        </View>
      </View>
      <View style={styles.iconContainer}>
        <FontAwesome6
          name="chevron-right"
          size={14}
          color={Theme.colors.textTertiary}
          solid
        />
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.touchable,
          pressed && styles.touchablePressed
        ]}
      >
        {({ pressed }) => <CardContent pressed={pressed} />}
      </Pressable>
    );
  }

  return <CardContent />;
};

const styles = StyleSheet.create({
  touchable: {
    marginHorizontal: Theme.spacing.md,
    marginVertical: Theme.spacing.xs,
  },
  touchablePressed: {
    opacity: 0.95,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    alignItems: 'center',
    ...Theme.shadows.small,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  cardPressed: {
    backgroundColor: Theme.colors.cardBackground,
    ...Theme.shadows.small,
  },
  imageContainer: {
    marginRight: Theme.spacing.sm,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.lightGrey,
  },
  imagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Theme.spacing.xs,
  },
  amountLabel: {
    fontSize: Theme.typography.fontSize.xs,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
    color: Theme.colors.textSecondary,
  },
  amount: {
    fontSize: Theme.typography.fontSize.large,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -0.4,
  },
  iconContainer: {
    marginLeft: Theme.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700' as const,
  },
  avatarOverflow: {
    backgroundColor: Theme.colors.lightGrey,
  },
  avatarOverflowText: {
    color: Theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '600' as const,
  },
  memberCountText: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily,
    marginLeft: Theme.spacing.sm,
  },
});

export default GroupCard;
