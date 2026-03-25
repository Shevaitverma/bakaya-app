import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText, G, Defs, ClipPath } from 'react-native-svg';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { formatCurrencyAbbreviated } from '../../utils/currency';

interface BarData {
  label: string;
  value: number;
  color: string;
  isHighlighted?: boolean;
}

interface VerticalBarChartProps {
  data: BarData[];
  maxValue?: number;
  formatValue?: (value: number) => string;
  height?: number;
  emptyMessage?: string;
}

const LABEL_AREA_HEIGHT = 24;
const VALUE_AREA_HEIGHT = 20;
const BAR_RADIUS = 6;
const BAR_MIN_HEIGHT = 4;
const HORIZONTAL_PADDING = 8;

export default function VerticalBarChart({
  data,
  maxValue,
  formatValue = formatCurrencyAbbreviated,
  height = 200,
  emptyMessage = 'No data available',
}: VerticalBarChartProps) {
  const [containerWidth, setContainerWidth] = React.useState(0);

  if (data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  const computedMax = maxValue ?? Math.max(...data.map((d) => d.value), 1);
  const totalSvgHeight = height;
  const chartAreaHeight = totalSvgHeight - LABEL_AREA_HEIGHT - VALUE_AREA_HEIGHT;
  const usableWidth = Math.max(containerWidth - HORIZONTAL_PADDING * 2, 0);
  const barCount = data.length;
  const barSlotWidth = barCount > 0 ? usableWidth / barCount : 0;
  const barWidth = Math.min(Math.max(barSlotWidth * 0.5, 16), 48);

  return (
    <View
      style={[styles.container, { height: totalSvgHeight }]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {containerWidth > 0 && (
        <Svg width={containerWidth} height={totalSvgHeight}>
          <Defs>
            {data.map((_, index) => {
              const slotX = HORIZONTAL_PADDING + index * barSlotWidth;
              const barX = slotX + (barSlotWidth - barWidth) / 2;
              const barHeight = computedMax > 0
                ? Math.max((data[index]!.value / computedMax) * chartAreaHeight, BAR_MIN_HEIGHT)
                : BAR_MIN_HEIGHT;
              const barY = VALUE_AREA_HEIGHT + (chartAreaHeight - barHeight);

              return (
                <ClipPath key={`clip-${index}`} id={`roundTop-${index}`}>
                  {/*
                    Rounded top corners via a tall rounded rect clipped
                    at the bottom by the bar area. The rect starts above
                    so only top corners show rounding.
                  */}
                  <Rect
                    x={barX}
                    y={barY}
                    width={barWidth}
                    height={barHeight + BAR_RADIUS}
                    rx={BAR_RADIUS}
                    ry={BAR_RADIUS}
                  />
                </ClipPath>
              );
            })}
          </Defs>

          {data.map((item, index) => {
            const slotX = HORIZONTAL_PADDING + index * barSlotWidth;
            const barX = slotX + (barSlotWidth - barWidth) / 2;
            const barHeight = computedMax > 0
              ? Math.max((item.value / computedMax) * chartAreaHeight, BAR_MIN_HEIGHT)
              : BAR_MIN_HEIGHT;
            const barY = VALUE_AREA_HEIGHT + (chartAreaHeight - barHeight);
            const barBottom = VALUE_AREA_HEIGHT + chartAreaHeight;
            const centerX = slotX + barSlotWidth / 2;
            const opacity = item.isHighlighted ? 1.0 : 0.65;

            return (
              <G key={`vbar-${index}`}>
                {/* Value label above bar */}
                <SvgText
                  x={centerX}
                  y={barY - 6}
                  fontSize={Typography.fontSize.xs}
                  fontWeight={Typography.fontWeight.semibold}
                  fill={item.isHighlighted ? Colors.textPrimary : Colors.textSecondary}
                  textAnchor="middle"
                  alignmentBaseline="baseline"
                >
                  {formatValue(item.value)}
                </SvgText>

                {/* Bar with rounded top corners */}
                <Rect
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill={item.color}
                  opacity={opacity}
                  clipPath={`url(#roundTop-${index})`}
                />

                {/* Highlight indicator dot below bar for current month */}
                {item.isHighlighted && (
                  <Rect
                    x={centerX - barWidth / 2}
                    y={barBottom + 1}
                    width={barWidth}
                    height={3}
                    rx={1.5}
                    ry={1.5}
                    fill={item.color}
                    opacity={1}
                  />
                )}

                {/* Month label below bar */}
                <SvgText
                  x={centerX}
                  y={barBottom + LABEL_AREA_HEIGHT - 4}
                  fontSize={Typography.fontSize.xs}
                  fontWeight={
                    item.isHighlighted
                      ? Typography.fontWeight.bold
                      : Typography.fontWeight.medium
                  }
                  fill={
                    item.isHighlighted
                      ? Colors.textPrimary
                      : Colors.textTertiary
                  }
                  textAnchor="middle"
                  alignmentBaseline="baseline"
                >
                  {item.label}
                </SvgText>
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
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.medium,
    color: Colors.textTertiary,
    fontWeight: Typography.fontWeight.regular,
  },
});
