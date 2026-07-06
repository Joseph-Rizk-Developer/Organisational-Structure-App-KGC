"use client";

import {
  Badge,
  Box,
  Button,
  Dialog,
  HStack,
  IconButton,
  Link,
  Portal,
  Separator,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  Building2,
  Eye,
  EyeOff,
  Mail,
  Pencil,
  Phone,
  UserRound,
  X,
} from "lucide-react";

import { departmentColor } from "@/lib/departments";
import { fullName } from "@/lib/employee-data";
import type { Employee } from "@/lib/types";

type ProfileDialogProps = {
  open: boolean;
  employee: Employee | null;
  manager: Employee | null;
  isAdmin: boolean;
  hasReports: boolean;
  reportsCollapsed: boolean;
  onClose: () => void;
  onEdit: (employee: Employee) => void;
  onToggleReports: (employeeId: string) => void;
};

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <HStack alignItems="flex-start" gap="3">
      <Box color="gray.700" marginTop="0.5">
        {icon}
      </Box>
      <Box minWidth="0">
        <Text color="gray.700" fontSize="xs" fontWeight="800" textTransform="uppercase">
          {label}
        </Text>
        <Box color="gray.950" fontSize="sm" fontWeight="600" overflowWrap="anywhere">
          {children}
        </Box>
      </Box>
    </HStack>
  );
}

export function ProfileDialog({
  open,
  employee,
  manager,
  isAdmin,
  hasReports,
  reportsCollapsed,
  onClose,
  onEdit,
  onToggleReports,
}: ProfileDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(details) => !details.open && onClose()} placement="center">
      <Portal>
        <Dialog.Backdrop background="blackAlpha.500" />
        <Dialog.Positioner>
          <Dialog.Content
            width="min(460px, calc(100vw - 24px))"
            borderRadius="8px"
            background="white"
            color="gray.950"
            borderWidth="1px"
            borderColor="gray.200"
            boxShadow="2xl"
          >
            {employee ? (
              <>
                <Dialog.Header alignItems="flex-start">
                  <Stack gap="2">
                    <Badge
                      alignSelf="flex-start"
                      background={`${departmentColor(employee.department)}1A`}
                      color={departmentColor(employee.department)}
                      borderRadius="4px"
                    >
                      {employee.department}
                    </Badge>
                    <HStack alignItems="center" gap="2" flexWrap="wrap">
                      <Dialog.Title color="gray.950" fontSize="xl" fontWeight="800">
                        {fullName(employee)}
                      </Dialog.Title>
                      {employee.isManager ? (
                        <Badge colorPalette="green" variant="subtle" borderRadius="4px">
                          Manager
                        </Badge>
                      ) : null}
                    </HStack>
                    <Text color="gray.700" fontSize="sm" fontWeight="600">
                      {employee.role}
                    </Text>
                  </Stack>
                  <IconButton
                    type="button"
                    variant="ghost"
                    color="gray.800"
                    aria-label="Close profile"
                    onClick={onClose}
                    _hover={{ background: "gray.100", color: "gray.950" }}
                  >
                    <X size={18} />
                  </IconButton>
                </Dialog.Header>

                <Dialog.Body>
                  <Separator borderColor="gray.300" marginBottom="5" />
                  <Stack gap="4">
                    <DetailRow icon={<UserRound size={17} />} label="Manager">
                      {manager ? fullName(manager) : "Top level"}
                    </DetailRow>
                    <DetailRow icon={<Phone size={17} />} label="Mobile">
                      <Link
                        href={`tel:${employee.mobile}`}
                        color="blue.800"
                        fontWeight="700"
                        textDecoration="underline"
                      >
                        {employee.mobile}
                      </Link>
                    </DetailRow>
                    <DetailRow icon={<Mail size={17} />} label="Email">
                      <Link
                        href={`mailto:${employee.email}`}
                        color="blue.800"
                        fontWeight="700"
                        textDecoration="underline"
                      >
                        {employee.email}
                      </Link>
                    </DetailRow>
                    {employee.isManager ? (
                      <DetailRow icon={<Building2 size={17} />} label="Head of department">
                        <HStack flexWrap="wrap" marginTop="1">
                          {employee.headOfDepartments.length > 0 ? (
                            employee.headOfDepartments.map((department) => (
                              <Badge
                                key={department}
                                variant="outline"
                                borderRadius="4px"
                                background="gray.50"
                                borderColor="gray.300"
                                color="gray.800"
                              >
                                {department}
                              </Badge>
                            ))
                          ) : (
                            <Text>None</Text>
                          )}
                        </HStack>
                      </DetailRow>
                    ) : null}
                  </Stack>
                </Dialog.Body>

                <Dialog.Footer borderTopWidth="1px" borderColor="gray.200">
                  <HStack width="full" justifyContent="flex-end" flexWrap="wrap">
                    {hasReports ? (
                      <Button
                        type="button"
                        variant="outline"
                        color="gray.800"
                        borderColor="gray.300"
                        onClick={() => onToggleReports(employee.id)}
                        _hover={{ background: "gray.100", color: "gray.950" }}
                      >
                        {reportsCollapsed ? <Eye size={16} /> : <EyeOff size={16} />}
                        {reportsCollapsed ? "Show reports" : "Hide reports"}
                      </Button>
                    ) : null}
                    {isAdmin ? (
                      <Button type="button" colorPalette="green" onClick={() => onEdit(employee)}>
                        <Pencil size={16} />
                        Edit
                      </Button>
                    ) : null}
                  </HStack>
                </Dialog.Footer>
              </>
            ) : null}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
