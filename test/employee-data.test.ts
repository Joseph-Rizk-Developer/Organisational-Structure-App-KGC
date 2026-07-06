import assert from "node:assert/strict";
import test from "node:test";

import {
  buildHierarchy,
  descendantsOf,
  filterHierarchy,
  fromDatabase,
  normaliseDepartments,
} from "../lib/employee-data";
import type { EmployeeRow } from "../lib/types";

test("normalises Supabase array formats for profile rendering", () => {
  assert.deepEqual(normaliseDepartments(["Sales", "Marketing"]), ["Sales", "Marketing"]);
  assert.deepEqual(normaliseDepartments('["Sales","Marketing"]'), ["Sales", "Marketing"]);
  assert.deepEqual(normaliseDepartments("{Sales,Marketing}"), ["Sales", "Marketing"]);
  assert.deepEqual(normaliseDepartments(null), []);
});

test("places employees beneath their appointed manager", () => {
  const manager = fromDatabase({
    id: 10,
    first_name: "Ava",
    last_name: "Morgan",
    role: "Director",
    department: "Executive",
    mobile: null,
    email: null,
    manager_id: null,
    is_manager: true,
    head_of_departments: "{Executive}",
  } satisfies EmployeeRow);
  const report = fromDatabase({
    id: "20",
    first_name: "Liam",
    last_name: "Chen",
    role: "Engineer",
    department: "Technology",
    mobile: null,
    email: null,
    manager_id: " 10 ",
    is_manager: false,
    head_of_departments: null,
  } satisfies EmployeeRow);

  const { childrenByManagerId, roots } = buildHierarchy([manager, report]);

  assert.deepEqual(roots.map((employee) => employee.id), ["10"]);
  assert.deepEqual(
    childrenByManagerId.get("10")?.map((employee) => employee.id),
    ["20"],
  );
  assert.deepEqual(report.headOfDepartments, []);
});

test("finds descendants so an employee cannot report to their own branch", () => {
  const employees = [
    {
      id: "1",
      firstName: "A",
      lastName: "Manager",
      role: "Director",
      department: "Executive",
      mobile: "",
      email: "",
      managerId: "",
      isManager: true,
      headOfDepartments: [],
    },
    {
      id: "2",
      firstName: "B",
      lastName: "Manager",
      role: "Lead",
      department: "Technology",
      mobile: "",
      email: "",
      managerId: "1",
      isManager: true,
      headOfDepartments: [],
    },
    {
      id: "3",
      firstName: "C",
      lastName: "Employee",
      role: "Engineer",
      department: "Technology",
      mobile: "",
      email: "",
      managerId: "2",
      isManager: false,
      headOfDepartments: [],
    },
  ];

  assert.deepEqual(descendantsOf(employees, "1"), ["2", "3"]);
});

test("keeps every sibling branch visible when all departments are selected", () => {
  const employees = [
    {
      id: "root",
      firstName: "Root",
      lastName: "Manager",
      role: "Director",
      department: "Executive",
      mobile: "",
      email: "",
      managerId: "",
      isManager: true,
      headOfDepartments: [],
    },
    ...["one", "two", "three"].map((id) => ({
      id,
      firstName: id,
      lastName: "Employee",
      role: "Employee",
      department: "Technology",
      mobile: "",
      email: "",
      managerId: "root",
      isManager: false,
      headOfDepartments: [],
    })),
  ];

  const filtered = filterHierarchy(employees, () => true);

  assert.deepEqual(filtered.roots.map((employee) => employee.id), ["root"]);
  assert.deepEqual(
    filtered.childrenByManagerId.get("root")?.map((employee) => employee.id),
    ["one", "two", "three"],
  );
  assert.equal(filtered.matchingCount, 4);
});
