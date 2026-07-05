export const normaliseId = (value) => (value == null ? "" : String(value).trim());

export const normaliseDepartments = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];

  const trimmed = value.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
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

export const fromDatabase = (row) => ({
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

export const toDatabase = (employee) => ({
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

export const buildHierarchy = (employees) => {
  const employeeById = new Map(employees.map((employee) => [normaliseId(employee.id), employee]));
  const childrenByManagerId = new Map();
  const roots = [];

  employees.forEach((employee) => {
    const employeeId = normaliseId(employee.id);
    const managerId = normaliseId(employee.managerId);
    const hasValidManager =
      managerId && managerId !== employeeId && employeeById.has(managerId);

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
