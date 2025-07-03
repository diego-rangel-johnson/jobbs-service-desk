export interface Company {
  id: string;
  name: string;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyWithUserCount extends Company {
  user_count?: number;
}

export interface UserWithCompany {
  id: string;
  user_id: string;
  name: string;
  email: string;
  company_id: string;
  company_name: string;
  role: 'admin' | 'support' | 'user';
  created_at: string;
}

export interface TicketWithCompany {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  department: string;
  customer_id: string;
  assignee_id?: string;
  company_id?: string;
  estimated_date?: string;
  created_at: string;
  updated_at: string;
  customer?: {
    user_id: string;
    name: string;
  };
  assignee?: {
    user_id: string;
    name: string;
  };
  company?: {
    id: string;
    name: string;
  };
} 