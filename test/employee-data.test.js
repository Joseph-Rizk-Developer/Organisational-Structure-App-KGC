import test from "node:test";
import assert from "node:assert/strict";

import {
  buildHierarchy,
  fromDatabase,
  normaliseDepartments,
} from "../public/employee-data.js";

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
    is_manager: true,
    head_of_departments: "{Executive}",
  });
  const report = fromDatabase({
    id: "20",
    first_name: "Liam",
    last_name: "Chen",
    role: "Engineer",
    department: "Technology",
    manager_id: " 10 ",
    is_manager: false,
    head_of_departments: null,
  });

  const { childrenByManagerId, roots } = buildHierarchy([manager, report]);

  assert.deepEqual(roots.map((employee) => employee.id), ["10"]);
  assert.deepEqual(
    childrenByManagerId.get("10").map((employee) => employee.id),
    ["20"],
  );
  assert.deepEqual(report.headOfDepartments, []);
});
