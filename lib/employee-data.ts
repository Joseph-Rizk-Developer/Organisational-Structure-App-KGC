import type { Employee, EmployeeDraft, EmployeeRow } from "@/lib/types";

export const normaliseId = (value: unknown) => (value == null ? "" : String(value).trim());

export const normaliseDepartments = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value !== "string" || !value.trim()) return [];

  const trimmed = value.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  }

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((department) => department.replace(/^"|"$/g, "").trim())
      .filter(Boolean);
  }

  return [trimmed];
};

export const fromDatabase = (row: EmployeeRow): Employee => ({
  id: normaliseId(row.id),
  firstName: row.first_name ?? "",
  lastName: row.last_name ?? "",
  role: row.role ?? "",
  department: row.department ?? "",
  mobile: row.mobile ?? "",
  email: row.email ?? "",
  managerId: normaliseId(row.manager_id),
  isManager: row.is_manager ?? false,
  headOfDepartments: normaliseDepartments(row.head_of_departments),
});

export const toDatabase = (employee: EmployeeDraft) => ({
  first_name: employee.firstName,
  last_name: employee.lastName,
  role: employee.role,
  department: employee.department,
  mobile: employee.mobile,
  email: employee.email,
  manager_id: employee.managerId || null,
  is_manager: employee.isManager,
  head_of_departments: employee.headOfDepartments,
});

export const buildHierarchy = (employees: Employee[]) => {
  const employeeById = new Map(employees.map((employee) => [normaliseId(employee.id), employee]));
  const childrenByManagerId = new Map<string, Employee[]>();
  const roots: Employee[] = [];

  employees.forEach((employee) => {
    const employeeId = normaliseId(employee.id);
    const managerId = normaliseId(employee.managerId);
    const hasValidManager =
      managerId.length > 0 && managerId !== employeeId && employeeById.has(managerId);

    if (!hasValidManager) {
      roots.push(employee);
      return;
    }

    const reports = childrenByManagerId.get(managerId) ?? [];
    reports.push(employee);
    childrenByManagerId.set(managerId, reports);
  });

  return { childrenByManagerId, roots };
};

export const descendantsOf = (employees: Employee[], managerId: string): string[] => {
  const directReports = employees.filter((employee) => employee.managerId === managerId);
  return directReports.flatMap((employee) => [
    employee.id,
    ...descendantsOf(employees, employee.id),
  ]);
};

export const fullName = (employee: Employee) =>
  `${employee.firstName} ${employee.lastName}`.trim();
