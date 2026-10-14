import { pool } from "./pool.js";

const schema = `
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('employee','supervisor','manager'))
);

-- Migration from the first draft, where name was UNIQUE.
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_name_key;

CREATE INDEX IF NOT EXISTS idx_employees_name
  ON employees(name);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  assigned_to INTEGER NOT NULL REFERENCES employees(id),
  created_by INTEGER NOT NULL REFERENCES employees(id),
  due_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to
  ON tasks(assigned_to);

CREATE INDEX IF NOT EXISTS idx_tasks_due_at
  ON tasks(due_at);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  actor_user_id INTEGER REFERENCES employees(id),
  action TEXT NOT NULL,
  target_user_id INTEGER REFERENCES employees(id),
  success BOOLEAN NOT NULL,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

const seed = `
INSERT INTO employees (id, name, department, role) VALUES
(1, 'منيرة', 'الإدارة', 'manager'),
(2, 'سارة', 'المشاريع', 'supervisor'),
(3, 'فهد', 'المشاريع', 'employee'),
(4, 'خالد', 'المشاريع', 'employee'),
(5, 'نورة', 'المالية', 'employee'),
(6, 'عبدالرحمن', 'المالية', 'supervisor')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  department = EXCLUDED.department,
  role = EXCLUDED.role;
`;

async function main() {
  await pool.query(schema);
  await pool.query(seed);
  console.log("Database initialized successfully.");
  await pool.end();
}

main().catch(async (error) => {
  console.error("Database initialization failed:", error);
  await pool.end();
  process.exit(1);
});