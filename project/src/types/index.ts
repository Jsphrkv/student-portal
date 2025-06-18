export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  // avatar?: string;
  created_at: string;
  // last_login?: string;
}

export interface Student {
  id: string;
  year: string;
  age: number;
  birthdate: string;
  sex: string;
  section: string;
  contact: string;
  created_at: string;
}
export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  instructor: string;
  schedule: {
    day: string;
    time: string;
    room: string;
  }[];
  semester: string;
  year: number;
}

export interface Grade {
  id: string;
  student_id: string;
  subject_id: string;
  semester: string;
  grade: number;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  created_at: string;
}

export interface Payment {
  id: string;
  student_id: string;
  billing_type: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  semester: string;
  remarks: string | null;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  semester: string;
  status: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_role: string;
  action_type: string;
  table_affected: string;
  record_id: string | null;
  old_values: any | null;
  new_values: any | null;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<void>;
  register: (data: StudentRegistrationData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export interface StudentRegistrationData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  year: string;
  age: number;
  birthdate: string;
  sex: string;
  section: string;
  contact: string;
}

export interface LoginData {
  email: string;
  password: string;
}
