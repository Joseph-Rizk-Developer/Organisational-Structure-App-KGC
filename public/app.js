import { createClient } from "@supabase/supabase-js";

const departments = [
  { name: "Executive", color: "#255c99" },
  { name: "Operations", color: "#14866d" },
  { name: "People", color: "#b54708" },
  { name: "Finance", color: "#7a5af8" },
  { name: "Technology", color: "#0e7490" },
  { name: "Sales", color: "#c11574" },
  { name: "Marketing", color: "#667085" },
];

const supabaseUrl = __SUPABASE_URL__;
const supabasePublishableKey = __SUPABASE_PUBLISHABLE_KEY__;
const isConfigured = Boolean(supabaseUrl && supabasePublishableKey);
const supabase = isConfigured ? createClient(supabaseUrl, supabasePublishableKey) : null;

let employees = [];
let selectedEmployeeId = "";
let activeDepartment = "All";
let collapsedManagers = new Set();
let currentUser = null;
let isAdmin = false;
let pendingAuthMessage = "";

const authView = document.querySelector("#authView");
const appShell = document.querySelector("#appShell");
const signInForm = document.querySelector("#signInForm");
const signInButton = document.querySelector("#signInButton");
const authStatus = document.querySelector("#authStatus");
const appStatus = document.querySelector("#appStatus");
const accountRole = document.querySelector("#accountRole");
const orgTree = document.querySelector("#orgTree");
const profileDetails = document.querySelector("#profileDetails");
const departmentFilters = document.querySelector("#departmentFilters");
const searchInput = document.querySelector("#searchInput");
const treeTitle = document.querySelector("#treeTitle");
const employeeDialog = document.querySelector("#employeeDialog");
const employeeForm = document.querySelector("#employeeForm");
const dialogTitle = document.querySelector("#dialogTitle");
const deleteEmployeeButton = document.querySelector("#deleteEmployeeButton");
const departmentSelect = document.querySelector("#department");
const managerSelect = document.querySelector("#managerId");
const isManagerInput = document.querySelector("#isManager");
const headOfDepartmentsField = document.querySelector("#headOfDepartmentsField");
const headOfDepartmentOptions = document.querySelector("#headOfDepartmentOptions");

const setStatus = (message = "") => {
  appStatus.textContent = message;
};

const setAuthStatus = (message = "") => {
  authStatus.textContent = message;
};

const setBusy = (button, busy, busyLabel) => {
  if (!button) return;
  if (busy) {
    button.dataset.label = button.textContent;
    button.textContent = busyLabel;
  } else if (button.dataset.label) {
    button.textContent = button.dataset.label;
  }
  button.disabled = busy;
};

const departmentColor = (department) =>
  departments.find((item) => item.name === department)?.color ?? "#667085";

const fullName = (employee) => `${employee.firstName} ${employee.lastName}`;

const escapeHtml = (value) => {
  const element = document.createElement("span");
  element.textContent = value;
  return element.innerHTML;
};

const fromDatabase = (row) => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  role: row.role,
  department: row.department,
  mobile: row.mobile ?? "",
  email: row.email ?? "",
  managerId: row.manager_id ?? "",
  isManager: row.is_manager ?? false,
  headOfDepartments: row.head_of_departments ?? [],
});

const toDatabase = (employee) => ({
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

const loadEmployees = async () => {
  setStatus("Loading directory...");
  const { data, error } = await supabase
    .from("employees")
    .select(
      "id, first_name, last_name, role, department, mobile, email, manager_id, is_manager, head_of_departments",
    )
    .order("last_name")
    .order("first_name");

  if (error) throw error;

  employees = data.map(fromDatabase);
  if (!employees.some((employee) => employee.id === selectedEmployeeId)) {
    selectedEmployeeId = employees[0]?.id ?? "";
  }
  setStatus("");
  render();
};

const matchesFilters = (employee) => {
  const query = searchInput.value.trim().toLowerCase();
  const inDepartment = activeDepartment === "All" || employee.department === activeDepartment;
  const searchText = [
    employee.firstName,
    employee.lastName,
    employee.role,
    employee.department,
    employee.email,
  ]
    .join(" ")
    .toLowerCase();

  return inDepartment && (!query || searchText.includes(query));
};

const descendantsOf = (managerId) => {
  const directReports = employees.filter((employee) => employee.managerId === managerId);
  return directReports.flatMap((employee) => [employee.id, ...descendantsOf(employee.id)]);
};

const visibleInBranch = (employee) => {
  if (matchesFilters(employee)) {
    return true;
  }

  return employees.some(
    (candidate) => candidate.managerId === employee.id && visibleInBranch(candidate),
  );
};

const buildTreeNode = (employee) => {
  const li = document.createElement("li");
  const card = document.createElement("button");
  const color = departmentColor(employee.department);
  const children = employees
    .filter((candidate) => candidate.managerId === employee.id)
    .filter(visibleInBranch)
    .sort((a, b) => fullName(a).localeCompare(fullName(b)));

  card.type = "button";
  card.className = "employee-card";
  card.style.setProperty("--department-color", color);
  card.dataset.employeeId = employee.id;

  if (employee.id === selectedEmployeeId) {
    card.classList.add("is-selected");
  }

  card.innerHTML = `
    <span class="employee-name">${escapeHtml(fullName(employee))}</span>
    <span class="employee-meta">${escapeHtml(employee.role)}</span>
    ${employee.isManager ? '<span class="manager-badge">Manager</span>' : ""}
  `;

  card.addEventListener("click", () => {
    selectedEmployeeId = employee.id;
    render();
  });

  li.append(card);

  if (children.length && !collapsedManagers.has(employee.id)) {
    const ul = document.createElement("ul");
    children.forEach((child) => ul.append(buildTreeNode(child)));
    li.append(ul);
  }

  return li;
};

const renderTree = () => {
  orgTree.innerHTML = "";

  const roots = employees
    .filter((employee) => !employee.managerId || !employees.some((item) => item.id === employee.managerId))
    .filter(visibleInBranch)
    .sort((a, b) => fullName(a).localeCompare(fullName(b)));

  const visibleCount = employees.filter(matchesFilters).length;
  treeTitle.textContent =
    activeDepartment === "All" ? `${visibleCount} Employees` : `${activeDepartment} Team`;

  if (!roots.length) {
    orgTree.innerHTML = '<p class="empty-state">No matching employees.</p>';
    return;
  }

  const ul = document.createElement("ul");
  roots.forEach((employee) => ul.append(buildTreeNode(employee)));
  orgTree.append(ul);
};

const renderDepartments = () => {
  departmentFilters.innerHTML = "";

  [{ name: "All", color: "#17201b" }, ...departments].forEach((department) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-chip";
    button.style.setProperty("--chip-color", department.color);
    button.textContent = department.name;
    button.setAttribute("aria-pressed", String(activeDepartment === department.name));
    button.addEventListener("click", () => {
      activeDepartment = department.name;
      render();
    });
    departmentFilters.append(button);
  });
};

const renderProfile = () => {
  const employee = employees.find((item) => item.id === selectedEmployeeId) ?? employees[0];

  if (!employee) {
    profileDetails.innerHTML = "<p>No employee selected.</p>";
    return;
  }

  selectedEmployeeId = employee.id;

  const manager = employees.find((item) => item.id === employee.managerId);
  const headDepartments = employee.headOfDepartments.length
    ? employee.headOfDepartments
        .map(
          (department) =>
            `<span class="department-tag" style="--chip-color: ${departmentColor(department)}">${escapeHtml(department)}</span>`,
        )
        .join("")
    : "None";

  profileDetails.innerHTML = `
    <div class="profile-name">${escapeHtml(fullName(employee))}</div>
    <div class="profile-line"><strong>Role</strong><span>${escapeHtml(employee.role)}</span></div>
    <div class="profile-line"><strong>Department</strong><span>${escapeHtml(employee.department)}</span></div>
    <div class="profile-line"><strong>Mobile</strong><span>${escapeHtml(employee.mobile)}</span></div>
    <div class="profile-line"><strong>Email</strong><span>${escapeHtml(employee.email)}</span></div>
    <div class="profile-line"><strong>Manager</strong><span>${manager ? escapeHtml(fullName(manager)) : "Top level"}</span></div>
    ${
      employee.isManager
        ? `<div class="profile-line"><strong>Head of department</strong><span class="filter-list">${headDepartments}</span></div>`
        : ""
    }
    <div class="profile-actions">
      ${
        isAdmin
          ? `<button class="secondary-button" type="button" data-edit-id="${employee.id}">Edit</button>`
          : ""
      }
      ${
        employees.some((candidate) => candidate.managerId === employee.id)
          ? `<button class="secondary-button" type="button" data-collapse-id="${employee.id}">
              ${collapsedManagers.has(employee.id) ? "Show reports" : "Hide reports"}
            </button>`
          : ""
      }
    </div>
  `;

  profileDetails.querySelector("[data-edit-id]")?.addEventListener("click", () => openDialog(employee.id));
  profileDetails.querySelector("[data-collapse-id]")?.addEventListener("click", () => {
    if (collapsedManagers.has(employee.id)) {
      collapsedManagers.delete(employee.id);
    } else {
      collapsedManagers.add(employee.id);
    }
    render();
  });
};

const render = () => {
  document.querySelectorAll(".admin-only").forEach((element) => {
    element.hidden = !isAdmin;
  });
  accountRole.textContent = currentUser
    ? `${currentUser.email} · ${isAdmin ? "Administrator" : "Viewer"}`
    : "";
  renderDepartments();
  renderTree();
  renderProfile();
};

const populateFormOptions = (editingEmployeeId = "") => {
  departmentSelect.innerHTML = departments
    .map((department) => `<option value="${department.name}">${escapeHtml(department.name)}</option>`)
    .join("");

  const blockedIds = editingEmployeeId ? [editingEmployeeId, ...descendantsOf(editingEmployeeId)] : [];
  const managerOptions = employees
    .filter((employee) => employee.isManager && !blockedIds.includes(employee.id))
    .map((employee) => `<option value="${employee.id}">${escapeHtml(fullName(employee))}</option>`)
    .join("");

  managerSelect.innerHTML = `<option value="">Top level</option>${managerOptions}`;

  headOfDepartmentOptions.innerHTML = departments
    .map(
      (department) => `
        <label>
          <input type="checkbox" name="headOfDepartments" value="${department.name}" />
          ${escapeHtml(department.name)}
        </label>
      `,
    )
    .join("");
};

const updateHeadOfDepartmentVisibility = () => {
  headOfDepartmentsField.classList.toggle("is-visible", isManagerInput.checked);
};

const openDialog = (employeeId = "") => {
  if (!isAdmin) return;

  const employee = employees.find((item) => item.id === employeeId);
  populateFormOptions(employeeId);

  dialogTitle.textContent = employee ? "Edit employee" : "Add employee";
  deleteEmployeeButton.hidden = !employee;
  employeeForm.reset();
  document.querySelector("#employeeId").value = employee?.id ?? "";

  if (employee) {
    document.querySelector("#firstName").value = employee.firstName;
    document.querySelector("#lastName").value = employee.lastName;
    document.querySelector("#role").value = employee.role;
    document.querySelector("#department").value = employee.department;
    document.querySelector("#mobile").value = employee.mobile;
    document.querySelector("#email").value = employee.email;
    document.querySelector("#managerId").value = employee.managerId;
    isManagerInput.checked = employee.isManager;
    employee.headOfDepartments.forEach((department) => {
      const checkbox = headOfDepartmentOptions.querySelector(`[value="${department}"]`);
      if (checkbox) checkbox.checked = true;
    });
  }

  updateHeadOfDepartmentVisibility();
  employeeDialog.showModal();
};

const closeDialog = () => {
  employeeDialog.close();
};

employeeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!isAdmin) return;

  const formData = new FormData(employeeForm);
  const id = document.querySelector("#employeeId").value;
  const isManager = formData.get("isManager") === "on";
  const headOfDepartments = isManager ? formData.getAll("headOfDepartments") : [];
  const employee = {
    id: id || undefined,
    firstName: formData.get("firstName").trim(),
    lastName: formData.get("lastName").trim(),
    role: formData.get("role").trim(),
    department: formData.get("department"),
    mobile: formData.get("mobile").trim(),
    email: formData.get("email").trim(),
    managerId: formData.get("managerId"),
    isManager,
    headOfDepartments,
  };

  const saveButton = document.querySelector("#saveEmployeeButton");
  setBusy(saveButton, true, "Saving...");
  setStatus("");

  try {
    if (id) {
      const { error } = await supabase.from("employees").update(toDatabase(employee)).eq("id", id);
      if (error) throw error;

      if (!isManager) {
        const { error: reportsError } = await supabase
          .from("employees")
          .update({ manager_id: employee.managerId || null })
          .eq("manager_id", id);
        if (reportsError) throw reportsError;
      }
      selectedEmployeeId = id;
    } else {
      const { data, error } = await supabase
        .from("employees")
        .insert(toDatabase(employee))
        .select("id")
        .single();
      if (error) throw error;
      selectedEmployeeId = data.id;
    }

    closeDialog();
    await loadEmployees();
  } catch (error) {
    setStatus(error.message || "Unable to save employee.");
  } finally {
    setBusy(saveButton, false);
  }
});

deleteEmployeeButton.addEventListener("click", async () => {
  if (!isAdmin) return;

  const employeeId = document.querySelector("#employeeId").value;
  const employee = employees.find((item) => item.id === employeeId);
  if (!employee) return;

  setBusy(deleteEmployeeButton, true, "Deleting...");
  setStatus("");

  try {
    const { error: reportsError } = await supabase
      .from("employees")
      .update({ manager_id: employee.managerId || null })
      .eq("manager_id", employeeId);
    if (reportsError) throw reportsError;

    const { error } = await supabase.from("employees").delete().eq("id", employeeId);
    if (error) throw error;

    selectedEmployeeId = "";
    closeDialog();
    await loadEmployees();
  } catch (error) {
    setStatus(error.message || "Unable to delete employee.");
  } finally {
    setBusy(deleteEmployeeButton, false);
  }
});

isManagerInput.addEventListener("change", updateHeadOfDepartmentVisibility);
searchInput.addEventListener("input", render);

document.querySelector("#addEmployeeButton").addEventListener("click", () => openDialog());
document.querySelector("#signOutButton").addEventListener("click", async () => {
  await supabase.auth.signOut();
});
document.querySelector("#closeDialogButton").addEventListener("click", closeDialog);
document.querySelector("#cancelDialogButton").addEventListener("click", closeDialog);
document.querySelector("#expandAllButton").addEventListener("click", () => {
  collapsedManagers = new Set();
  render();
});
document.querySelector("#collapseAllButton").addEventListener("click", () => {
  collapsedManagers = new Set(
    employees
      .filter((employee) => employees.some((candidate) => candidate.managerId === employee.id))
      .map((employee) => employee.id),
  );
  render();
});

signInForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase) return;

  const formData = new FormData(signInForm);
  setAuthStatus("");
  setBusy(signInButton, true, "Signing in...");

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email").trim(),
    password: formData.get("password"),
  });

  if (error) {
    setAuthStatus(error.message);
    setBusy(signInButton, false);
  }
});

const loadCurrentUser = async (session) => {
  currentUser = session?.user ?? null;
  isAdmin = false;
  employees = [];
  selectedEmployeeId = "";

  if (!currentUser) {
    appShell.hidden = true;
    authView.hidden = false;
    signInForm.reset();
    setAuthStatus(pendingAuthMessage);
    pendingAuthMessage = "";
    setBusy(signInButton, false);
    return;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .single();

  if (error) {
    pendingAuthMessage = "Your account does not have directory access.";
    await supabase.auth.signOut();
    return;
  }

  isAdmin = profile.role === "admin";
  authView.hidden = true;
  appShell.hidden = false;
  setBusy(signInButton, false);

  try {
    await loadEmployees();
  } catch (loadError) {
    setStatus(loadError.message || "Unable to load the directory.");
    render();
  }
};

const initialise = async () => {
  if (!isConfigured) {
    setAuthStatus("Supabase is not configured for this deployment.");
    signInButton.disabled = true;
    return;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  await loadCurrentUser(session);

  supabase.auth.onAuthStateChange((event, nextSession) => {
    if (event === "INITIAL_SESSION") return;
    setTimeout(() => loadCurrentUser(nextSession), 0);
  });
};

initialise();
