"use client";

import {
  Box,
  Button,
  Checkbox,
  Dialog,
  Field,
  Grid,
  HStack,
  IconButton,
  Input,
  NativeSelect,
  Portal,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { departments } from "@/lib/departments";
import { descendantsOf, fullName } from "@/lib/employee-data";
import type { Employee, EmployeeDraft } from "@/lib/types";

const emptyDraft: EmployeeDraft = {
  firstName: "",
  lastName: "",
  role: "",
  department: "Executive",
  mobile: "",
  email: "",
  managerId: "",
  isManager: false,
  headOfDepartments: [],
};

type EmployeeDialogProps = {
  open: boolean;
  employee: Employee | null;
  employees: Employee[];
  busy: boolean;
  errorMessage: string;
  onClose: () => void;
  onSave: (draft: EmployeeDraft, employeeId?: string) => Promise<void>;
  onDelete: (employee: Employee) => Promise<void>;
};

export function EmployeeDialog({
  open,
  employee,
  employees,
  busy,
  errorMessage,
  onClose,
  onSave,
  onDelete,
}: EmployeeDialogProps) {
  const [draft, setDraft] = useState<EmployeeDraft>(emptyDraft);

  useEffect(() => {
    if (!open) return;
    setDraft(
      employee
        ? {
            firstName: employee.firstName,
            lastName: employee.lastName,
            role: employee.role,
            department: employee.department,
            mobile: employee.mobile,
            email: employee.email,
            managerId: employee.managerId,
            isManager: employee.isManager,
            headOfDepartments: employee.headOfDepartments,
          }
        : emptyDraft,
    );
  }, [employee, open]);

  const managerOptions = useMemo(() => {
    const blockedIds = employee
      ? new Set([employee.id, ...descendantsOf(employees, employee.id)])
      : new Set<string>();

    return employees
      .filter((candidate) => candidate.isManager && !blockedIds.has(candidate.id))
      .sort((a, b) => fullName(a).localeCompare(fullName(b)));
  }, [employee, employees]);

  const update = <Key extends keyof EmployeeDraft>(key: Key, value: EmployeeDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const toggleHeadDepartment = (department: string, checked: boolean) => {
    setDraft((current) => ({
      ...current,
      headOfDepartments: checked
        ? [...new Set([...current.headOfDepartments, department])]
        : current.headOfDepartments.filter((item) => item !== department),
    }));
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open && !busy) onClose();
      }}
      placement="center"
      size={{ mdDown: "full", md: "lg" }}
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop background="blackAlpha.500" />
        <Dialog.Positioner>
          <Dialog.Content borderRadius={{ mdDown: "0", md: "8px" }} background="white">
            <Box
              as="form"
              onSubmit={(event) => {
                event.preventDefault();
                void onSave(draft, employee?.id);
              }}
            >
              <Dialog.Header borderBottomWidth="1px" borderColor="gray.200">
                <Stack gap="1">
                  <Text
                    color="gray.500"
                    fontSize="xs"
                    fontWeight="800"
                    textTransform="uppercase"
                  >
                    Employee profile
                  </Text>
                  <Dialog.Title>{employee ? "Edit employee" : "Add employee"}</Dialog.Title>
                </Stack>
                <IconButton
                  type="button"
                  variant="ghost"
                  aria-label="Close employee editor"
                  onClick={onClose}
                  disabled={busy}
                >
                  <X size={18} />
                </IconButton>
              </Dialog.Header>

              <Dialog.Body paddingY="6">
                {errorMessage ? (
                  <Box
                    role="alert"
                    background="red.50"
                    borderWidth="1px"
                    borderColor="red.200"
                    borderRadius="6px"
                    color="red.800"
                    padding="3"
                    marginBottom="5"
                    fontSize="sm"
                  >
                    {errorMessage}
                  </Box>
                ) : null}
                <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
                  <Field.Root required>
                    <Field.Label>First name</Field.Label>
                    <Input
                      value={draft.firstName}
                      onChange={(event) => update("firstName", event.target.value)}
                      autoComplete="given-name"
                    />
                  </Field.Root>

                  <Field.Root required>
                    <Field.Label>Last name</Field.Label>
                    <Input
                      value={draft.lastName}
                      onChange={(event) => update("lastName", event.target.value)}
                      autoComplete="family-name"
                    />
                  </Field.Root>

                  <Field.Root required>
                    <Field.Label>Role</Field.Label>
                    <Input
                      value={draft.role}
                      onChange={(event) => update("role", event.target.value)}
                    />
                  </Field.Root>

                  <Field.Root required>
                    <Field.Label>Department</Field.Label>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        value={draft.department}
                        onChange={(event) => update("department", event.target.value)}
                      >
                        {departments.map((department) => (
                          <option key={department.name} value={department.name}>
                            {department.name}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Field.Root>

                  <Field.Root required>
                    <Field.Label>Mobile number</Field.Label>
                    <Input
                      value={draft.mobile}
                      onChange={(event) => update("mobile", event.target.value)}
                      inputMode="tel"
                      autoComplete="tel"
                    />
                  </Field.Root>

                  <Field.Root required>
                    <Field.Label>Email address</Field.Label>
                    <Input
                      type="email"
                      value={draft.email}
                      onChange={(event) => update("email", event.target.value)}
                      autoComplete="email"
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Manager</Field.Label>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        value={draft.managerId}
                        onChange={(event) => update("managerId", event.target.value)}
                      >
                        <option value="">Top level</option>
                        {managerOptions.map((manager) => (
                          <option key={manager.id} value={manager.id}>
                            {fullName(manager)}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Field.Root>

                  <Field.Root alignSelf="end">
                    <Checkbox.Root
                      checked={draft.isManager}
                      onCheckedChange={(details) => {
                        const isManager = details.checked === true;
                        setDraft((current) => ({
                          ...current,
                          isManager,
                          headOfDepartments: isManager ? current.headOfDepartments : [],
                        }));
                      }}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Label>Manager profile</Checkbox.Label>
                    </Checkbox.Root>
                  </Field.Root>
                </SimpleGrid>

                {draft.isManager ? (
                  <Box marginTop="6">
                    <Text fontSize="sm" fontWeight="700" marginBottom="3">
                      Head of department
                    </Text>
                    <Grid
                      templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }}
                      gap="3"
                    >
                      {departments.map((department) => (
                        <Checkbox.Root
                          key={department.name}
                          checked={draft.headOfDepartments.includes(department.name)}
                          onCheckedChange={(details) =>
                            toggleHeadDepartment(department.name, details.checked === true)
                          }
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                          <Checkbox.Label>{department.name}</Checkbox.Label>
                        </Checkbox.Root>
                      ))}
                    </Grid>
                  </Box>
                ) : null}
              </Dialog.Body>

              <Dialog.Footer borderTopWidth="1px" borderColor="gray.200">
                <HStack width="full" justifyContent="space-between">
                  <Box>
                    {employee ? (
                      <Button
                        type="button"
                        variant="outline"
                        colorPalette="red"
                        onClick={() => void onDelete(employee)}
                        disabled={busy}
                      >
                        <Trash2 size={16} />
                        Delete
                      </Button>
                    ) : null}
                  </Box>
                  <HStack>
                    <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
                      Cancel
                    </Button>
                    <Button type="submit" colorPalette="green" loading={busy}>
                      <Save size={16} />
                      Save
                    </Button>
                  </HStack>
                </HStack>
              </Dialog.Footer>
            </Box>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
