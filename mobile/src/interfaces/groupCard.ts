export interface GroupCardProps {
  title: string;
  amount: number;
  imageUri?: string;
  onPress?: () => void;
  memberCount?: number;
  memberNames?: string[];
  totalExpenses?: number;
}
