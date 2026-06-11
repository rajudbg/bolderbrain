// Standardized employee record
export type NormalizedEmployee = {
  email: string;
  name: string;
  department?: string;
  role?: string;
  managerEmail?: string;
  isActive: boolean;
};

// Normalize payload from Darwinbox
export function normalizeDarwinbox(payload: any): NormalizedEmployee[] {
  // Assume payload has a `data` array of employees
  const employees = Array.isArray(payload.data) ? payload.data : [payload];
  return employees.map((emp: any) => ({
    email: emp.email || emp.work_email,
    name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.name,
    department: emp.department || emp.dept,
    role: emp.designation || emp.job_title || 'EMPLOYEE',
    managerEmail: emp.manager_email || emp.reporting_manager_email,
    isActive: emp.status === 'Active' || emp.is_active === true,
  }));
}

// Normalize payload from Keka
export function normalizeKeka(payload: any): NormalizedEmployee[] {
  const employees = Array.isArray(payload) ? payload : [payload];
  return employees.map((emp: any) => ({
    email: emp.email,
    name: emp.displayName || emp.name,
    department: emp.departmentName,
    role: emp.jobTitle || 'EMPLOYEE',
    managerEmail: emp.reportsTo?.email,
    isActive: emp.employeeStatus === 'Active',
  }));
}

// Normalize payload from GreytHR
export function normalizeGreytHR(payload: any): NormalizedEmployee[] {
  const employees = Array.isArray(payload) ? payload : [payload];
  return employees.map((emp: any) => ({
    email: emp.emailAddress,
    name: emp.employeeName,
    department: emp.department,
    role: emp.designation || 'EMPLOYEE',
    managerEmail: emp.managerEmail,
    isActive: emp.status === 'Active',
  }));
}

export function normalizeHrmsPayload(provider: string, payload: any): NormalizedEmployee[] {
  switch (provider.toLowerCase()) {
    case 'darwinbox': return normalizeDarwinbox(payload);
    case 'keka': return normalizeKeka(payload);
    case 'greythr': return normalizeGreytHR(payload);
    default: throw new Error(`Unsupported HRMS provider: ${provider}`);
  }
}
