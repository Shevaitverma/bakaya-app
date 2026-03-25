export interface Group {
  id: string;
  title: string;
  amount: number;
  imageUri?: string;
  memberCount?: number;
  memberNames?: string[];
  totalExpenses?: number;
}
