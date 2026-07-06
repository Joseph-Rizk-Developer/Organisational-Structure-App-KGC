export const departments = [
  { name: "Executive", color: "#255c99" },
  { name: "Operations", color: "#14866d" },
  { name: "People", color: "#b54708" },
  { name: "Finance", color: "#7a5af8" },
  { name: "Technology", color: "#0e7490" },
  { name: "Sales", color: "#c11574" },
  { name: "Marketing", color: "#667085" },
] as const;

export const departmentColor = (department: string) =>
  departments.find((item) => item.name === department)?.color ?? "#667085";
