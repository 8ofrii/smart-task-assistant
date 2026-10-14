export type Role = "employee" | "supervisor" | "manager";

export type Intent =
  | "create_task"
  | "list_tasks"
  | "policy_question"
  | "unknown";

export type ListScope = "self" | "department" | "all" | "employee";

export type PolicyTopic =
  | "working_hours"
  | "annual_leave"
  | "sick_leave"
  | "remote_work"
  | "expenses"
  | "task_status_update"
  | "unknown";

export interface Employee {
  id: number;
  name: string;
  department: string;
  role: Role;
}

export interface ParsedMessage {
  intent: Intent;

  // create_task
  assigneeName?: string | null;
  assigneeDepartment?: string | null;
  description?: string | null;
  dateExpression?: string | null;
  timeExpression?: string | null;

  // list_tasks
  listScope?: ListScope | null;
  targetEmployeeName?: string | null;
  targetDepartment?: string | null;

  // policy_question
  policyTopic?: PolicyTopic | null;
  policyQuestion?: string | null;
}

export interface ParseResult {
  data: ParsedMessage;
  source: "openai" | "gemini" | "fallback";
}