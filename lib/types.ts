export type UserRole = "viewer" | "admin";

export type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string;
  mobile: string;
  email: string;
  managerId: string;
  isManager: boolean;
  headOfDepartments: string[];
};

export type EmployeeDraft = Omit<Employee, "id">;

export type EmployeeRow = {
  id: string | number;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  department: string | null;
  mobile: string | null;
  email: string | null;
  manager_id: string | number | null;
  is_manager: boolean | null;
  head_of_departments: string[] | string | null;
};
