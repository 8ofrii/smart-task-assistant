import type { Employee } from "../types/index.js";

export function canAssignTask(sender: Employee, target: Employee): boolean {
  if (sender.role === "manager") return true;

  if (sender.role === "supervisor") {
    return sender.department === target.department;
  }

  return sender.id === target.id;
}

export function canViewTaskOwner(sender: Employee, owner: Employee): boolean {
  if (sender.role === "manager") return true;

  if (sender.role === "supervisor") {
    return sender.department === owner.department;
  }

  return sender.id === owner.id;
}

export function canViewDepartment(
  sender: Employee,
  department: string
): boolean {
  if (sender.role === "manager") return true;

  return (
    sender.role === "supervisor" &&
    sender.department === department
  );
}

export function canViewAllTasks(sender: Employee): boolean {
  return sender.role === "manager";
}