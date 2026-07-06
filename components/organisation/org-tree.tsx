"use client";

import { Badge, Box, Button, Text } from "@chakra-ui/react";

import { departmentColor } from "@/lib/departments";
import { fullName, normaliseId } from "@/lib/employee-data";
import type { Employee } from "@/lib/types";

type OrgTreeProps = {
  roots: Employee[];
  childrenByManagerId: Map<string, Employee[]>;
  collapsedManagers: Set<string>;
  selectedEmployeeId: string;
  onSelect: (employee: Employee) => void;
};

type TreeNodeProps = Omit<OrgTreeProps, "roots"> & {
  employee: Employee;
};

function TreeNode({
  employee,
  childrenByManagerId,
  collapsedManagers,
  selectedEmployeeId,
  onSelect,
}: TreeNodeProps) {
  const color = departmentColor(employee.department);
  const children = childrenByManagerId.get(normaliseId(employee.id)) ?? [];
  const isCollapsed = collapsedManagers.has(employee.id);
  const isSelected = employee.id === selectedEmployeeId;

  return (
    <li className="org-tree-node">
      <Button
        type="button"
        onClick={() => onSelect(employee)}
        aria-label={`View ${fullName(employee)}'s profile`}
        aria-pressed={isSelected}
        width="176px"
        minHeight="92px"
        height="auto"
        display="grid"
        alignContent="center"
        justifyItems="start"
        gap="1.5"
        padding="3.5"
        borderRadius="8px"
        borderWidth="1px"
        borderColor={isSelected ? color : "gray.200"}
        borderLeftWidth="7px"
        borderLeftColor={color}
        background="white"
        color="gray.900"
        boxShadow={isSelected ? "0 14px 32px rgba(23, 32, 27, 0.16)" : "sm"}
        whiteSpace="normal"
        textAlign="left"
        transition="transform 140ms ease, box-shadow 140ms ease"
        _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
        _focusVisible={{ outline: "3px solid", outlineColor: "blue.200", outlineOffset: "2px" }}
      >
        <Text fontWeight="800" lineHeight="1.15" overflowWrap="anywhere">
          {fullName(employee)}
        </Text>
        <Text color="gray.600" fontSize="xs" fontWeight="600" lineHeight="1.3">
          {employee.role}
        </Text>
        {employee.isManager ? (
          <Badge
            size="sm"
            borderRadius="4px"
            background={`${color}1A`}
            color={color}
            textTransform="uppercase"
          >
            Manager
          </Badge>
        ) : null}
      </Button>

      {children.length > 0 && !isCollapsed ? (
        <ul className="org-tree-list">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              employee={child}
              childrenByManagerId={childrenByManagerId}
              collapsedManagers={collapsedManagers}
              selectedEmployeeId={selectedEmployeeId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function OrgTree(props: OrgTreeProps) {
  if (props.roots.length === 0) {
    return (
      <Box padding="12" textAlign="center">
        <Text color="gray.600">No matching employees.</Text>
      </Box>
    );
  }

  return (
    <Box className="org-tree" aria-label="Organisation hierarchy">
      <ul className="org-tree-list">
        {props.roots.map((employee) => (
          <TreeNode key={employee.id} employee={employee} {...props} />
        ))}
      </ul>
    </Box>
  );
}
