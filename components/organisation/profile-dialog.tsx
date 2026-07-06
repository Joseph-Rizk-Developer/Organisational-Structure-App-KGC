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
      <Box color="gray.500" marginTop="0.5">
        {icon}
      </Box>
      <Box minWidth="0">
        <Text color="gray.500" fontSize="xs" fontWeight="700" textTransform="uppercase">
          {label}
        </Text>
        <Box color="gray.800" fontSize="sm" overflowWrap="anywhere">
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
          <Dialog.Content width="min(460px, calc(100vw - 24px))" borderRadius="8px">
            {employee ? (
              <>
                <Dialog.Header alignItems="flex-start">
                  <Stack gap="2">
                    <HStack>
                      <Badge
                        background={`${departmentColor(employee.department)}1A`}
                        color={departmentColor(employee.department)}
                        borderRadius="4px"
                      >
                        {employee.department}
                      </Badge>
                      {employee.isManager ? (
                        <Badge colorPalette="green" variant="subtle" borderRadius="4px">
                          Manager
                        </Badge>
                      ) : null}
                    </HStack>
                    <Dialog.Title fontSize="xl">{fullName(employee)}</Dialog.Title>
                    <Text color="gray.600" fontSize="sm">
                      {employee.role}
                    </Text>
                  </Stack>
                  <IconButton type="button" variant="ghost" aria-label="Close profile" onClick={onClose}>
                    <X size={18} />
                  </IconButton>
                </Dialog.Header>

                <Dialog.Body>
                  <Separator marginBottom="5" />
                  <Stack gap="4">
                    <DetailRow icon={<UserRound size={17} />} label="Manager">
                      {manager ? fullName(manager) : "Top level"}
                    </DetailRow>
                    <DetailRow icon={<Phone size={17} />} label="Mobile">
                      <Link href={`tel:${employee.mobile}`} color="blue.700">
                        {employee.mobile}
                      </Link>
                    </DetailRow>
                    <DetailRow icon={<Mail size={17} />} label="Email">
                      <Link href={`mailto:${employee.email}`} color="blue.700">
                        {employee.email}
                      </Link>
                    </DetailRow>
                    {employee.isManager ? (
                      <DetailRow icon={<Building2 size={17} />} label="Head of department">
                        <HStack flexWrap="wrap" marginTop="1">
                          {employee.headOfDepartments.length > 0 ? (
                            employee.headOfDepartments.map((department) => (
                              <Badge key={department} variant="outline" borderRadius="4px">
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
                        onClick={() => onToggleReports(employee.id)}
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
