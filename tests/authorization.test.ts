import { describe, expect, it } from "vitest";
import {
  canAssignTask,
  canViewAllTasks,
  canViewDepartment,
  canViewTaskOwner
} from "../src/services/authorization.service.js";

const monira = {
  id: 1,
  name: "منيرة",
  department: "الإدارة",
  role: "manager" as const
};

const sara = {
  id: 2,
  name: "سارة",
  department: "المشاريع",
  role: "supervisor" as const
};

const fahad = {
  id: 3,
  name: "فهد",
  department: "المشاريع",
  role: "employee" as const
};

const khaled = {
  id: 4,
  name: "خالد",
  department: "المشاريع",
  role: "employee" as const
};

const nora = {
  id: 5,
  name: "نورة",
  department: "المالية",
  role: "employee" as const
};

describe("task authorization", () => {
  it("employee can assign only to self", () => {
    expect(canAssignTask(fahad, fahad)).toBe(true);
    expect(canAssignTask(fahad, khaled)).toBe(false);
  });

  it("supervisor can assign inside the same department only", () => {
    expect(canAssignTask(sara, khaled)).toBe(true);
    expect(canAssignTask(sara, nora)).toBe(false);
  });

  it("manager can assign to anyone", () => {
    expect(canAssignTask(monira, khaled)).toBe(true);
    expect(canAssignTask(monira, nora)).toBe(true);
  });

  it("task visibility follows role boundaries", () => {
    expect(canViewTaskOwner(fahad, fahad)).toBe(true);
    expect(canViewTaskOwner(fahad, khaled)).toBe(false);
    expect(canViewTaskOwner(sara, khaled)).toBe(true);
    expect(canViewTaskOwner(sara, nora)).toBe(false);
    expect(canViewTaskOwner(monira, nora)).toBe(true);
  });

  it("only manager can view all tasks", () => {
    expect(canViewAllTasks(monira)).toBe(true);
    expect(canViewAllTasks(sara)).toBe(false);
    expect(canViewAllTasks(fahad)).toBe(false);
  });

  it("supervisor can view only own department", () => {
    expect(canViewDepartment(sara, "المشاريع")).toBe(true);
    expect(canViewDepartment(sara, "المالية")).toBe(false);
    expect(canViewDepartment(monira, "المالية")).toBe(true);
  });
});