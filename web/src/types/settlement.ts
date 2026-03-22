export interface Settlement {
  _id: string;
  groupId: string;
  paidBy: { id: string; name: string; email: string };
  paidTo: { id: string; name: string; email: string };
  amount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
