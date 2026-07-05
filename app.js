const departments = [
  { name: "Executive", color: "#255c99" },
  { name: "Operations", color: "#14866d" },
  { name: "People", color: "#b54708" },
  { name: "Finance", color: "#7a5af8" },
  { name: "Technology", color: "#0e7490" },
  { name: "Sales", color: "#c11574" },
  { name: "Marketing", color: "#667085" },
];

let employees = [
  {
    id: "ava",
    firstName: "Ava",
    lastName: "Morgan",
    role: "Chief Executive Officer",
    department: "Executive",
    mobile: "+61 400 100 100",
    email: "ava.morgan@example.com",
    managerId: "",
    isManager: true,
    headOfDepartments: ["Executive", "Operations", "Finance"],
  },
  {
    id: "liam",
    firstName: "Liam",
    lastName: "Chen",
    role: "Head of Technology",
    department: "Technology",
    mobile: "+61 400 200 200",
    email: "liam.chen@example.com",
    managerId: "ava",
    isManager: true,
    headOfDepartments: ["Technology"],
  },
  {
    id: "mia",
    firstName: "Mia",
    lastName: "Patel",
    role: "Head of People",
    department: "People",
    mobile: "+61 400 300 300",
    email: "mia.patel@example.com",
    managerId: "ava",
    isManager: true,
    headOfDepartments: ["People"],
  },
  {
    id: "noah",
    firstName: "Noah",
    lastName: "Rivera",
    role: "Head of Revenue",
    department: "Sales",
    mobile: "+61 400 400 400",
    email: "noah.rivera@example.com",
    managerId: "ava",
    isManager: true,
    headOfDepartments: ["Sales", "Marketing"],
  },
  {
    id: "sophia",
    firstName: "Sophia",
    lastName: "Nguyen",
    role: "Product Engineer",
    department: "Technology",
    mobile: "+61 400 510 510",
    email: "sophia.nguyen@example.com",
    managerId: "liam",
    isManager: false,
    headOfDepartments: [],
  },
  {
    id: "ethan",
    firstName: "Ethan",
    lastName: "Brown",
    role: "Systems Analyst",
    department: "Technology",
    mobile: "+61 400 520 520",
    email: "ethan.brown@example.com",
    managerId: "liam",
    isManager: false,
    headOfDepartments: [],
  },
  {
    id: "isla",
    firstName: "Isla",
    lastName: "Wilson",
    role: "People Partner",
    department: "People",
    mobile: "+61 400 610 610",
    email: "isla.wilson@example.com",
    managerId: "mia",
    isManager: false,
    headOfDepartments: [],
  },
  {
    id: "lucas",
    firstName: "Lucas",
    lastName: "Taylor",
    role: "Account Executive",
    department: "Sales",
    mobile: "+61 400 710 710",
    email: "lucas.taylor@example.com",
    managerId: "noah",
    isManager: false,
    headOfDepartments: [],
  },
  {
    id: "amelia",
    firstName: "Amelia",
    lastName: "Scott",
    role: "Brand Lead",
    department: "Marketing",
    mobile: "+61 400 720 720",
    email: "amelia.scott@example.com",
    managerId: "noah",
    isManager: false,
    headOfDepartments: [],
  },
];

const storageKey = "organisation-structure-employees";
const savedEmployees = localStorage.getItem(storageKey);

if (savedEmployees) {
  employees = JSON.parse(savedEmployees);
}

let selectedEmployeeId = employees[0]?.id ?? "";
let activeDepartment = "All";
let collapsedManagers = new Set();

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

const departmentColor = (department) =>
  departments.find((item) => item.name === department)?.color ?? "#667085";

const fullName = (employee) => `${employee.firstName} ${employee.lastName}`;

const escapeHtml = (value) => {
  const element = document.createElement("span");
  element.textContent = value;
  return element.innerHTML;
};

const makeEmployeeId = () =>
  crypto.randomUUID?.() ?? `employee-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const saveEmployees = () => {
  localStorage.setItem(storageKey, JSON.stringify(employees));
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
      <button class="secondary-button" type="button" data-edit-id="${employee.id}">Edit</button>
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

employeeForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(employeeForm);
  const id = document.querySelector("#employeeId").value || makeEmployeeId();
  const isManager = formData.get("isManager") === "on";
  const headOfDepartments = isManager ? formData.getAll("headOfDepartments") : [];
  const employee = {
    id,
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

  employees = employees.some((item) => item.id === id)
    ? employees.map((item) => (item.id === id ? employee : item))
    : [...employees, employee];

  if (!isManager) {
    employees = employees.map((item) =>
      item.managerId === id ? { ...item, managerId: employee.managerId } : item,
    );
  }

  selectedEmployeeId = id;
  saveEmployees();
  closeDialog();
  render();
});

deleteEmployeeButton.addEventListener("click", () => {
  const employeeId = document.querySelector("#employeeId").value;
  const employee = employees.find((item) => item.id === employeeId);
  if (!employee) return;

  employees = employees
    .filter((item) => item.id !== employeeId)
    .map((item) => (item.managerId === employeeId ? { ...item, managerId: employee.managerId } : item));

  selectedEmployeeId = employees[0]?.id ?? "";
  saveEmployees();
  closeDialog();
  render();
});

isManagerInput.addEventListener("change", updateHeadOfDepartmentVisibility);
searchInput.addEventListener("input", render);

document.querySelector("#addEmployeeButton").addEventListener("click", () => openDialog());
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

render();
