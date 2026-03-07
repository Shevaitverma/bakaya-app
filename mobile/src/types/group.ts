/**
 * Group type definitions
 */

export interface GroupMember {
  userId: {
    _id: string;
    email: string;
  };
  role: string;
  joinedAt: string;
}

export interface GroupData {
  _id: string;
  name: string;
  description: string;
  createdBy: {
    _id: string;
    email: string;
  };
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface GroupsData {
  groups: GroupData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface GroupsResponse {
  success: boolean;
  data: GroupsData;
  meta: {
    timestamp: string;
  };
}
