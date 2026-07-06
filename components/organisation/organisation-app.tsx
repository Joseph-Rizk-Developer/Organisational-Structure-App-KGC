"use client";

import {
  Badge,
  Box,
  Button,
  Field,
  Flex,
  Grid,
  Heading,
  HStack,
  IconButton,
  Input,
  Separator,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { createClient } from "@supabase/supabase-js";
import type { Session, User } from "@supabase/supabase-js";
import {
  ChevronDown,
  ChevronUp,
  LogOut,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EmployeeDialog } from "@/components/organisation/employee-dialog";
import { OrgTree } from "@/components/organisation/org-tree";
import { ProfileDialog } from "@/components/organisation/profile-dialog";
import { departmentColor, departments } from "@/lib/departments";
import {
  filterHierarchy,
  fromDatabase,
  fullName,
  toDatabase,
} from "@/lib/employee-data";
import type { Employee, EmployeeDraft, EmployeeRow, UserRole } from "@/lib/types";

type OrganisationAppProps = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

type AuthPhase = "loading" | "signedOut" | "signedIn";

const employeeColumns =
  "id, first_name, last_name, role, department, mobile, email, manager_id, is_manager, head_of_departments";

export function OrganisationApp({
  supabaseUrl,
  supabasePublishableKey,
}: OrganisationAppProps) {
  const supabase = useMemo(
    () =>
      supabaseUrl && supabasePublishableKey
        ? createClient(supabaseUrl, supabasePublishableKey)
        : null,
    [supabasePublishableKey, supabaseUrl],
  );

  const [authPhase, setAuthPhase] = useState<AuthPhase>("loading");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>("viewer");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [activeDepartment, setActiveDepartment] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedManagers, setCollapsedManagers] = useState<Set<string>>(new Set());
  const [profileOpen, setProfileOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [status, setStatus] = useState("");
  const [authStatus, setAuthStatus] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const pendingAuthMessage = useRef("");

  const isAdmin = userRole === "admin";
  const selectedEmployee =
    employees.find((employee) => employee.id === selectedEmployeeId) ?? null;
  const selectedManager =
    employees.find((employee) => employee.id === selectedEmployee?.managerId) ?? null;

  const loadEmployees = useCallback(async () => {
    if (!supabase) return;

    setStatus("Loading directory...");
    const { data, error } = await supabase
      .from("employees")
      .select(employeeColumns)
      .order("last_name")
      .order("first_name");

    if (error) throw error;

    const nextEmployees = (data as EmployeeRow[]).map(fromDatabase);
    setEmployees(nextEmployees);
    setSelectedEmployeeId((current) =>
      nextEmployees.some((employee) => employee.id === current)
        ? current
        : (nextEmployees[0]?.id ?? ""),
    );
    setStatus("");
  }, [supabase]);

  const hydrateSession = useCallback(
    async (session: Session | null) => {
      if (!supabase) return;

      if (!session?.user) {
        setCurrentUser(null);
        setUserRole("viewer");
        setEmployees([]);
        setAuthPhase("signedOut");
        setAuthBusy(false);
        setAuthStatus(pendingAuthMessage.current);
        pendingAuthMessage.current = "";
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (error || (profile?.role !== "admin" && profile?.role !== "viewer")) {
        pendingAuthMessage.current = "Your account does not have directory access.";
        await supabase.auth.signOut();
        return;
      }

      setCurrentUser(session.user);
      setUserRole(profile.role);
      setAuthPhase("signedIn");
      setAuthBusy(false);
      setAuthStatus("");

      try {
        await loadEmployees();
      } catch (error: unknown) {
        setStatus(error instanceof Error ? error.message : "Unable to load the directory.");
      }
    },
    [loadEmployees, supabase],
  );

  useEffect(() => {
    if (!supabase) {
      setAuthPhase("signedOut");
      setAuthStatus("Supabase is not configured for this deployment.");
      return;
    }

    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) void hydrateSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;
      window.setTimeout(() => {
        if (active) void hydrateSession(session);
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [hydrateSession, supabase]);

  const filteredHierarchy = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matches = (employee: Employee) => {
      const inDepartment =
        activeDepartment === "All" || employee.department === activeDepartment;
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

    return filterHierarchy(employees, matches);
  }, [activeDepartment, employees, searchQuery]);

  const openProfile = (employee: Employee) => {
    setSelectedEmployeeId(employee.id);
    setProfileOpen(true);
  };

  const openEditor = (employee: Employee | null) => {
    setProfileOpen(false);
    setEditingEmployee(employee);
    setEditorOpen(true);
    setStatus("");
  };

  const saveEmployee = async (draft: EmployeeDraft, employeeId?: string) => {
    if (!supabase || !isAdmin) return;

    setActionBusy(true);
    setStatus("");
    const cleanDraft: EmployeeDraft = {
      ...draft,
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      role: draft.role.trim(),
      mobile: draft.mobile.trim(),
      email: draft.email.trim(),
    };

    try {
      if (employeeId) {
        const { data, error } = await supabase
          .from("employees")
          .update(toDatabase(cleanDraft))
          .eq("id", employeeId)
          .select("id")
          .single();
        if (error || !data) throw error ?? new Error("Employee update was not applied.");

        if (!cleanDraft.isManager) {
          const { error: reportsError } = await supabase
            .from("employees")
            .update({ manager_id: cleanDraft.managerId || null })
            .eq("manager_id", employeeId);
          if (reportsError) throw reportsError;
        }
        setSelectedEmployeeId(employeeId);
      } else {
        const { data, error } = await supabase
          .from("employees")
          .insert(toDatabase(cleanDraft))
          .select("id")
          .single();
        if (error || !data) throw error ?? new Error("Employee was not created.");
        setSelectedEmployeeId(String(data.id));
      }

      setEditorOpen(false);
      await loadEmployees();
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : "Unable to save employee.");
    } finally {
      setActionBusy(false);
    }
  };

  const deleteEmployee = async (employee: Employee) => {
    if (!supabase || !isAdmin) return;

    setActionBusy(true);
    setStatus("");
    try {
      const { error: reportsError } = await supabase
        .from("employees")
        .update({ manager_id: employee.managerId || null })
        .eq("manager_id", employee.id);
      if (reportsError) throw reportsError;

      const { data, error } = await supabase
        .from("employees")
        .delete()
        .eq("id", employee.id)
        .select("id")
        .single();
      if (error || !data) throw error ?? new Error("Employee deletion was not applied.");

      setEditorOpen(false);
      setSelectedEmployeeId("");
      await loadEmployees();
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : "Unable to delete employee.");
    } finally {
      setActionBusy(false);
    }
  };

  const toggleReports = (employeeId: string) => {
    setCollapsedManagers((current) => {
      const next = new Set(current);
      if (next.has(employeeId)) next.delete(employeeId);
      else next.add(employeeId);
      return next;
    });
  };

  const selectDepartment = (department: string) => {
    setActiveDepartment(department);
    if (department === "All") {
      setSearchQuery("");
      setCollapsedManagers(new Set());
    }
  };

  const signIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;

    setAuthBusy(true);
    setAuthStatus("");
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setAuthStatus(error.message);
      setAuthBusy(false);
    }
  };

  if (authPhase === "loading") {
    return (
      <Flex minHeight="100vh" alignItems="center" justifyContent="center">
        <Stack alignItems="center" gap="3">
          <Spinner color="green.600" size="lg" />
          <Text color="gray.600">Loading directory...</Text>
        </Stack>
      </Flex>
    );
  }

  if (authPhase === "signedOut") {
    return (
      <Flex minHeight="100vh" alignItems="center" justifyContent="center" padding="6">
        <Box
          width="min(400px, 100%)"
          background="white"
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="8px"
          boxShadow="lg"
          padding={{ base: "6", md: "8" }}
        >
          <form onSubmit={signIn}>
            <Stack gap="5">
              <Box>
                <Text
                  color="gray.500"
                  fontSize="xs"
                  fontWeight="800"
                  textTransform="uppercase"
                >
                  Company directory
                </Text>
                <Heading size="xl" marginTop="1">
                  Organisation Structure
                </Heading>
              </Box>
              <Field.Root required>
                <Field.Label>Email address</Field.Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                />
              </Field.Root>
              <Field.Root required>
                <Field.Label>Password</Field.Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                />
              </Field.Root>
              {authStatus ? (
                <Box
                  role="alert"
                  background="red.50"
                  borderWidth="1px"
                  borderColor="red.200"
                  borderRadius="6px"
                  color="red.800"
                  padding="3"
                  fontSize="sm"
                >
                  {authStatus}
                </Box>
              ) : null}
              <Button type="submit" colorPalette="green" loading={authBusy} disabled={!supabase}>
                Sign in
              </Button>
            </Stack>
          </form>
        </Box>
      </Flex>
    );
  }

  return (
    <>
      <Grid
        minHeight="100vh"
        templateColumns={{ base: "1fr", lg: "320px minmax(0, 1fr)" }}
        background="gray.50"
      >
        <Box
          as="aside"
          background="white"
          borderRightWidth={{ base: "0", lg: "1px" }}
          borderBottomWidth={{ base: "1px", lg: "0" }}
          borderColor="gray.200"
          padding="5"
        >
          <Stack gap="6">
            <HStack justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Text
                  color="gray.500"
                  fontSize="xs"
                  fontWeight="800"
                  textTransform="uppercase"
                >
                  Company directory
                </Text>
                <Heading size="lg" marginTop="1">
                  Organisation Structure
                </Heading>
              </Box>
              {isAdmin ? (
                <IconButton
                  type="button"
                  colorPalette="green"
                  aria-label="Add employee"
                  title="Add employee"
                  onClick={() => openEditor(null)}
                >
                  <Plus size={19} />
                </IconButton>
              ) : null}
            </HStack>

            <Box position="relative">
              <Box
                position="absolute"
                left="3"
                top="50%"
                transform="translateY(-50%)"
                color="gray.500"
                pointerEvents="none"
                zIndex="1"
              >
                <Search size={17} />
              </Box>
              <Input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Name, role, department"
                paddingLeft="10"
                background="white"
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="800" marginBottom="3">
                Departments
              </Text>
              <Flex gap="2" flexWrap="wrap">
                {["All", ...departments.map((department) => department.name)].map(
                  (department) => {
                    const active = activeDepartment === department;
                    const color =
                      department === "All" ? "#17201b" : departmentColor(department);
                    return (
                      <Button
                        key={department}
                        type="button"
                        size="xs"
                        variant={active ? "solid" : "outline"}
                        background={active ? color : "white"}
                        borderColor={active ? color : "gray.200"}
                        color={active ? "white" : "gray.700"}
                        borderRadius="6px"
                        onClick={() => selectDepartment(department)}
                        _hover={{ background: active ? color : "gray.50" }}
                      >
                        {department}
                      </Button>
                    );
                  },
                )}
              </Flex>
            </Box>

            <Separator />

            <Stack gap="2">
              <HStack justifyContent="space-between">
                <HStack>
                  <Users size={17} />
                  <Text fontSize="sm" fontWeight="800">
                    Access
                  </Text>
                </HStack>
                <Badge colorPalette={isAdmin ? "green" : "gray"} borderRadius="4px">
                  {isAdmin ? "Administrator" : "Viewer"}
                </Badge>
              </HStack>
              <Text color="gray.600" fontSize="sm" overflowWrap="anywhere">
                {currentUser?.email}
              </Text>
              <Button
                type="button"
                variant="outline"
                size="sm"
                justifyContent="flex-start"
                onClick={() => void supabase?.auth.signOut()}
              >
                <LogOut size={16} />
                Sign out
              </Button>
            </Stack>
          </Stack>
        </Box>

        <Flex as="main" minWidth="0" flexDirection="column">
          <Flex
            minHeight="84px"
            alignItems={{ base: "flex-start", md: "center" }}
            justifyContent="space-between"
            flexDirection={{ base: "column", md: "row" }}
            gap="4"
            padding={{ base: "5", md: "5 7" }}
            background="white"
            borderBottomWidth="1px"
            borderColor="gray.200"
          >
            <Box>
              <Text
                color="gray.500"
                fontSize="xs"
                fontWeight="800"
                textTransform="uppercase"
              >
                Live tree
              </Text>
              <Heading size="md" marginTop="1">
                {activeDepartment === "All"
                  ? `${filteredHierarchy.matchingCount} Employees`
                  : `${activeDepartment} Team`}
              </Heading>
            </Box>
            <HStack>
              <Button
                type="button"
                variant="outline"
                size="sm"
                color="gray.800"
                borderColor="gray.300"
                onClick={() => setCollapsedManagers(new Set())}
                _hover={{ background: "gray.100", color: "gray.950" }}
              >
                <ChevronDown size={16} />
                Expand all
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                color="gray.800"
                borderColor="gray.300"
                onClick={() =>
                  setCollapsedManagers(
                    new Set(
                      employees
                        .filter((employee) =>
                          employees.some((candidate) => candidate.managerId === employee.id),
                        )
                        .map((employee) => employee.id),
                    ),
                  )
                }
                _hover={{ background: "gray.100", color: "gray.950" }}
              >
                <ChevronUp size={16} />
                Collapse all
              </Button>
            </HStack>
          </Flex>

          {status ? (
            <Box
              role="status"
              margin="4 6 0"
              padding="3"
              borderRadius="6px"
              background={status === "Loading directory..." ? "blue.50" : "red.50"}
              color={status === "Loading directory..." ? "blue.800" : "red.800"}
              fontSize="sm"
            >
              {status}
            </Box>
          ) : null}

          <Box flex="1" minHeight="0" overflow="auto" padding={{ base: "5", md: "8" }}>
            <OrgTree
              roots={filteredHierarchy.roots}
              childrenByManagerId={filteredHierarchy.childrenByManagerId}
              collapsedManagers={collapsedManagers}
              selectedEmployeeId={selectedEmployeeId}
              onSelect={openProfile}
            />
          </Box>
        </Flex>
      </Grid>

      <ProfileDialog
        open={profileOpen}
        employee={selectedEmployee}
        manager={selectedManager}
        isAdmin={isAdmin}
        hasReports={Boolean(
          selectedEmployee &&
            employees.some((employee) => employee.managerId === selectedEmployee.id),
        )}
        reportsCollapsed={Boolean(
          selectedEmployee && collapsedManagers.has(selectedEmployee.id),
        )}
        onClose={() => setProfileOpen(false)}
        onEdit={openEditor}
        onToggleReports={(employeeId) => {
          toggleReports(employeeId);
          setProfileOpen(false);
        }}
      />

      <EmployeeDialog
        open={editorOpen}
        employee={editingEmployee}
        employees={employees}
        busy={actionBusy}
        errorMessage={status && status !== "Loading directory..." ? status : ""}
        onClose={() => {
          if (!actionBusy) setEditorOpen(false);
        }}
        onSave={saveEmployee}
        onDelete={deleteEmployee}
      />
    </>
  );
}
