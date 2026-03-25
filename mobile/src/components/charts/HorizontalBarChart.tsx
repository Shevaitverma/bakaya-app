import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText, G } from 'react-native-svg';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';

interface BarData {
  label: string;
  value: number;
  color: string;
  percentage?: number;
  emoji?: string;
}

interface HorizontalBarChartProps {
  data: BarData[];
  maxValue?: number;
  formatValue?: (value: number) => string;
  emptyMessage?: string;
}

const ROW_HEIGHT = 40;
const ROW_GAP = 8;
const LABEL_WIDTH = 100;
const VALUE_WIDTH = 100;
const BAR_HEIGHT = 20;
const BAR_RADIUS = 6;

export default function HorizontalBarChart({
  data,
  maxValue,
  formatValue = formatCurrency,
  emptyMessage = 'No data available',
}: HorizontalBarChartProps) {
  const [containerWidth, setContainerWidth] = React.useState(0);

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  const computedMax = maxValue ?? Math.max(...data.map((d) => d.value), 1);
  const totalHeight = data.length * ROW_HEIGHT + (data.length - 1) * ROW_GAP;
  const barAreaWidth = Math.max(containerWidth - LABEL_WIDTH - VALUE_WIDTH, 40);

  return (
    <View
      style={styles.container}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {containerWidth > 0 && (
        <Svg width={containerWidth} height={totalHeight}>
          {data.map((item, index) => {
            const y = index * (ROW_HEIGHT + ROW_GAP);
            const barWidth = computedMax > 0
              ? Math.max((item.value / computedMax) * barAreaWidth, 4)
              : 4;
            const barY = y + (ROW_HEIGHT - BAR_HEIGHT) / 2;
            const pctText = item.percentage !== undefined
              ? `${item.percentage}%`
              : '';
            const valueText = formatValue(item.value);
            const labelText = item.emoji
              ? `${item.emoji} ${item.label}`
              : item.label;

            return (
              <G key={`bar-${index}`}>
                {/* Label on the left */}
                <SvgText
                  x={0}
                  y={y + ROW_HEIGHT / 2 + 1}
                  fontSize={Typography.fontSize.small}
                  fontWeight={Typography.fontWeight.medium}
                  fill={Colors.textPrimary}
                  textAnchor="start"
                  alignmentBaseline="central"
                >
                  {labelText.length > 12
                    ? labelText.slice(0, 11) + '...'
                    : labelText}
                </SvgText>

                {/* Bar background track */}
                <Rect
                  x={LABEL_WIDTH}
                  y={barY}
                  width={barAreaWidth}
                  height={BAR_HEIGHT}
                  rx={BAR_RADIUS}
                  ry={BAR_RADIUS}
                  fill={Colors.lightGrey}
                />

                {/* Colored bar fill */}
                <Rect
                  x={LABEL_WIDTH}
                  y={barY}
                  width={barWidth}
                  height={BAR_HEIGHT}
                  rx={BAR_RADIUS}
                  ry={BAR_RADIUS}
                  fill={item.color}
                  opacity={0.9}
                />

                {/* Value + percentage on the right */}
                <SvgText
                  x={LABEL_WIDTH + barAreaWidth + 8}
                  y={y + ROW_HEIGHT / 2 - (pctText ? 3 : 0)}
                  fontSize={Typography.fontSize.small}
                  fontWeight={Typography.fontWeight.semibold}
                  fill={Colors.textPrimary}
                  textAnchor="start"
                  alignmentBaseline="central"
                >
                  {valueText}
                </SvgText>
                {pctText ? (
                  <SvgText
                    x={LABEL_WIDTH + barAreaWidth + 8}
                    y={y + ROW_HEIGHT / 2 + 12}
                    fontSize={Typography.fontSize.xs}
                    fontWeight={Typography.fontWeight.regular}
                    fill={Colors.textTertiary}
                    textAnchor="start"
                    alignmentBaseline="central"
                  >
                    {pctText}
                  </SvgText>
                ) : null}
              </G>
            );
          })}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: Spacing.sm,
  },
  emptyContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.medium,
    color: Colors.textTertiary,
    fontWeight: Typography.fontWeight.regular,
  },
});
