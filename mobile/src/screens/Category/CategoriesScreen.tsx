/**
 * Categories Screen - Full CRUD management for expense categories
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { categoryService } from '../../services/categoryService';
import { EmojiPicker } from '../../components/EmojiPicker';
import { ColorPicker } from '../../components/ColorPicker';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import type { Category } from '../../types/category';
import type { MeStackParamList } from '../../navigation/types';

type CategoriesScreenProps = NativeStackScreenProps<MeStackParamList, 'Categories'>;

const CategoriesScreen: React.FC<CategoriesScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuth();

  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Archived section toggle
  const [archivedExpanded, setArchivedExpanded] = useState(false);

  // Add/Edit modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmoji, setFormEmoji] = useState('\uD83C\uDF7D\uFE0F');
  const [formColor, setFormColor] = useState('#D81B60');
  const [formNameError, setFormNameError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  // Emoji picker state
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);

  // Delete dialog state
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Modal animation
  const modalScaleAnim = React.useRef(new Animated.Value(0)).current;
  const modalOpacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    if (modalVisible) {
      animation = Animated.parallel([
        Animated.spring(modalScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(modalOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]);
      animation.start();
    } else {
      modalScaleAnim.setValue(0);
      modalOpacityAnim.setValue(0);
    }

    return () => {
      animation?.stop();
    };
  }, [modalVisible, modalScaleAnim, modalOpacityAnim]);

  // ---- Data fetching ----
  const lastFetchTime = useRef<number>(0);

  const fetchCategories = useCallback(async () => {
    if (!accessToken) {
      setError('Authentication required');
      setLoading(false);
      return;
    }
    if (Date.now() - lastFetchTime.current < 30000) return;

    try {
      setLoading(true);
      setError(null);
      const response = await categoryService.getCategories(accessToken);

      if (response.success && response.data) {
        setCategories(response.data.categories);
        lastFetchTime.current = Date.now();
      } else {
        throw new Error('Failed to fetch categories');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred while fetching categories';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [fetchCategories])
  );

  // ---- Derived data ----

  const activeCategories = categories.filter((c) => c.isActive);
  const archivedCategories = categories.filter((c) => !c.isActive);

  // ---- Add / Edit modal ----

  const openAddModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormEmoji('\uD83C\uDF7D\uFE0F');
    setFormColor('#D81B60');
    setFormNameError(undefined);
    setModalVisible(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormEmoji(category.emoji);
    setFormColor(category.color);
    setFormNameError(undefined);
    setModalVisible(true);
  };

  const closeModal = () => {
    if (!saving) {
      setModalVisible(false);
      setEditingCategory(null);
      setEmojiPickerVisible(false);
    }
  };

  const handleSave = async () => {
    // Validate
    const trimmedName = formName.trim();
    if (!trimmedName) {
      setFormNameError('Category name is required');
      return;
    }
    setFormNameError(undefined);

    if (!accessToken) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    setSaving(true);

    try {
      if (editingCategory) {
        // Update existing
        const response = await categoryService.updateCategory(
          editingCategory.id,
          { name: trimmedName, emoji: formEmoji, color: formColor },
          accessToken
        );

        if (response.success && response.data) {
          // Update local state
          setCategories((prev) =>
            prev.map((c) => (c.id === editingCategory.id ? response.data.category : c))
          );
        }
      } else {
        // Create new
        const response = await categoryService.createCategory(
          { name: trimmedName, emoji: formEmoji, color: formColor },
          accessToken
        );

        if (response.success && response.data) {
          setCategories((prev) => [...prev, response.data.category]);
        }
      }

      setModalVisible(false);
      setEditingCategory(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save category';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // ---- Archive / Unarchive ----

  const handleToggleArchive = async (category: Category) => {
    if (!accessToken) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    const newIsActive = !category.isActive;

    // Optimistic update
    setCategories((prev) =>
      prev.map((c) => (c.id === category.id ? { ...c, isActive: newIsActive } : c))
    );

    try {
      await categoryService.updateCategory(
        category.id,
        { isActive: newIsActive },
        accessToken
      );
    } catch (err) {
      // Revert optimistic update
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? { ...c, isActive: category.isActive } : c))
      );
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update category';
      Alert.alert('Error', errorMessage);
    }
  };

  // ---- Delete ----

  const handleDeletePress = (category: Category) => {
    if (category.isDefault) {
      Alert.alert('Cannot Delete', 'Default categories cannot be deleted.');
      return;
    }

    setCategoryToDelete(category);
    setDeleteLoading(false);
    setDeleteDialogVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!accessToken || !categoryToDelete) return;

    setDeleteLoading(true);

    // Optimistic update
    const deletedId = categoryToDelete.id;
    setCategories((prev) => prev.filter((c) => c.id !== deletedId));

    // Close dialog immediately
    setDeleteDialogVisible(false);
    setCategoryToDelete(null);

    try {
      await categoryService.deleteCategory(deletedId, accessToken);
    } catch (err) {
      // Revert - re-fetch
      fetchCategories();
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete category';
      Alert.alert('Error', errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    if (!deleteLoading) {
      setDeleteDialogVisible(false);
      setCategoryToDelete(null);
      setDeleteLoading(false);
    }
  };

  // ---- Render helpers ----

  const renderCategoryRow = (item: Category, index: number, isLast: boolean) => (
    <View
      key={item.id}
      style={[styles.categoryCard, !isLast && styles.categoryCardMargin]}>
      <View style={styles.categoryCardContent}>
        {/* Emoji */}
        <View style={styles.emojiContainer}>
          <Text style={styles.emojiLarge}>{item.emoji}</Text>
        </View>

        {/* Info */}
        <View style={styles.categoryInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.categoryName} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={[styles.colorDot, { backgroundColor: item.color }]} />
            {item.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Default</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          {/* Edit */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => openEditModal(item)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <FontAwesome6
              name="pen-to-square"
              size={15}
              color={Theme.colors.primary}
              solid
            />
          </TouchableOpacity>

          {/* Archive / Unarchive */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleToggleArchive(item)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <FontAwesome6
              name={item.isActive ? 'box-archive' : 'box-open'}
              size={15}
              color={Theme.colors.warning}
              solid
            />
          </TouchableOpacity>

          {/* Delete (hidden for default categories) */}
          {!item.isDefault && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleDeletePress(item)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <FontAwesome6
                name="trash-can"
                size={15}
                color={Theme.colors.error}
                solid
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  // ---- Loading state ----

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />
        <ActivityIndicator size="large" color={Theme.colors.textOnPrimary} />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  // ---- Error state ----

  if (error && categories.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />
        <FontAwesome6
          name="triangle-exclamation"
          size={48}
          color={Theme.colors.error}
          solid
        />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCategories}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Theme.spacing.md }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <FontAwesome6
              name="arrow-left"
              size={20}
              color={Theme.colors.textOnPrimary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Categories</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={openAddModal}
            activeOpacity={0.8}>
            <FontAwesome6
              name="plus"
              size={18}
              color={Theme.colors.primary}
              solid
            />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentWrapper}>
        <ScrollView
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}>
          {/* Active Categories Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Categories</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{activeCategories.length}</Text>
            </View>
          </View>

          {activeCategories.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>No active categories</Text>
            </View>
          ) : (
            activeCategories.map((cat, idx) =>
              renderCategoryRow(cat, idx, idx === activeCategories.length - 1)
            )
          )}

          {/* Archived Categories Section */}
          {archivedCategories.length > 0 && (
            <>
              <TouchableOpacity
                style={styles.sectionHeaderTouchable}
                onPress={() => setArchivedExpanded(!archivedExpanded)}
                activeOpacity={0.7}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Archived Categories</Text>
                  <View style={styles.sectionHeaderRight}>
                    <View style={[styles.countBadge, styles.countBadgeArchived]}>
                      <Text style={[styles.countBadgeText, styles.countBadgeTextArchived]}>
                        {archivedCategories.length}
                      </Text>
                    </View>
                    <FontAwesome6
                      name={archivedExpanded ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={Theme.colors.textSecondary}
                    />
                  </View>
                </View>
              </TouchableOpacity>

              {archivedExpanded &&
                archivedCategories.map((cat, idx) =>
                  renderCategoryRow(cat, idx, idx === archivedCategories.length - 1)
                )}
            </>
          )}

          {/* Empty state when no categories at all */}
          {categories.length === 0 && (
            <View style={styles.emptyContainer}>
              <FontAwesome6
                name="tags"
                size={48}
                color={Theme.colors.textTertiary}
                solid
              />
              <Text style={styles.emptyText}>No categories yet</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to create your first category
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Add / Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
        statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalBackdrop,
              { opacity: modalOpacityAnim },
            ]}
          />
          <Animated.View
            style={[
              styles.modalCard,
              {
                transform: [{ scale: modalScaleAnim }],
                opacity: modalOpacityAnim,
              },
            ]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeModal}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <FontAwesome6
                  name="xmark"
                  size={18}
                  color={Theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Name Input */}
            <Input
              label="Name"
              placeholder="Category name"
              value={formName}
              onChangeText={(text) => {
                setFormName(text);
                if (formNameError) setFormNameError(undefined);
              }}
              error={formNameError}
              autoCapitalize="words"
              autoFocus={!editingCategory}
            />

            {/* Emoji Selector */}
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Emoji</Text>
              <TouchableOpacity
                style={styles.emojiSelector}
                onPress={() => setEmojiPickerVisible(true)}
                activeOpacity={0.7}>
                <Text style={styles.emojiSelectorText}>{formEmoji}</Text>
                <Text style={styles.emojiSelectorHint}>Tap to change</Text>
              </TouchableOpacity>
            </View>

            {/* Color Selector */}
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Color</Text>
              <ColorPicker
                selectedColor={formColor}
                onSelect={setFormColor}
              />
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={closeModal}
                disabled={saving}
                style={styles.modalActionButton}
              />
              <Button
                title="Save"
                variant="primary"
                onPress={handleSave}
                loading={saving}
                disabled={saving}
                style={styles.modalActionButton}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Emoji Picker Modal */}
      <EmojiPicker
        visible={emojiPickerVisible}
        selectedEmoji={formEmoji}
        onSelect={(emoji) => {
          setFormEmoji(emoji);
          setEmojiPickerVisible(false);
        }}
        onClose={() => setEmojiPickerVisible(false)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        visible={deleteDialogVisible}
        title="Delete Category"
        message={
          categoryToDelete
            ? `Are you sure you want to delete "${categoryToDelete.name}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={deleteLoading}
        variant="danger"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  header: {
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.lg,
    backgroundColor: Theme.colors.primary,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Theme.typography.fontSize.display,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -1,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.white,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.lg,
    ...Theme.shadows.medium,
    gap: Theme.spacing.xs,
  },
  addButtonText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    overflow: 'hidden',
  },
  listContent: {
    paddingTop: Theme.spacing.md + 4,
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
  },

  // ---- Section headers ----
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.sm,
    marginTop: Theme.spacing.sm,
  },
  sectionHeaderTouchable: {
    marginTop: Theme.spacing.lg,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: Theme.typography.fontSize.large,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
  },
  countBadge: {
    backgroundColor: `${Theme.colors.primary}15`,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.sm,
  },
  countBadgeText: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  countBadgeArchived: {
    backgroundColor: `${Theme.colors.grey}15`,
  },
  countBadgeTextArchived: {
    color: Theme.colors.textSecondary,
  },

  // ---- Category card ----
  categoryCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.md,
    ...Theme.shadows.small,
  },
  categoryCardMargin: {
    marginBottom: Theme.spacing.sm,
  },
  categoryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    gap: Theme.spacing.md,
  },
  emojiContainer: {
    width: 48,
    height: 48,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: Theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiLarge: {
    fontSize: 26,
  },
  categoryInfo: {
    flex: 1,
    gap: Theme.spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  categoryName: {
    fontSize: Theme.typography.fontSize.large,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
    flexShrink: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: Theme.borderRadius.round,
  },
  defaultBadge: {
    backgroundColor: `${Theme.colors.primary}15`,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.sm,
  },
  defaultBadgeText: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ---- Empty states ----
  emptySection: {
    paddingVertical: Theme.spacing.lg,
    alignItems: 'center',
  },
  emptySectionText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.xxxl,
    gap: Theme.spacing.md,
  },
  emptyText: {
    fontSize: Theme.typography.fontSize.large,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  emptySubtext: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
    textAlign: 'center',
  },

  // ---- Loading / Error ----
  loadingText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    marginTop: Theme.spacing.md,
  },
  errorText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    textAlign: 'center',
    marginTop: Theme.spacing.md,
  },
  retryButton: {
    backgroundColor: Theme.colors.white,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    marginTop: Theme.spacing.md,
  },
  retryButtonText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },

  // ---- Modal ----
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalCard: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.lg,
    ...Theme.shadows.large,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  modalTitle: {
    fontSize: Theme.typography.fontSize.xlarge,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: Theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formField: {
    marginBottom: Theme.spacing.md,
  },
  formLabel: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
    marginBottom: Theme.spacing.xs,
  },
  emojiSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    gap: Theme.spacing.md,
  },
  emojiSelectorText: {
    fontSize: 30,
  },
  emojiSelectorHint: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginTop: Theme.spacing.md,
  },
  modalActionButton: {
    flex: 1,
  },
});

export default CategoriesScreen;
