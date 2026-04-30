const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || 'Request failed')
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  // Customers
  getCustomers: () => request<Customer[]>('/customers'),
  getCustomer: (id: string) => request<Customer>(`/customers/${id}`),
  createCustomer: (data: Partial<Customer>) =>
    request<Customer>('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id: string, data: Partial<Customer>) =>
    request<Customer>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id: string) =>
    request<void>(`/customers/${id}`, { method: 'DELETE' }),

  // Projects
  getProjects: (params?: { status?: string; customerId?: string }) => {
    const q = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<Project[]>(`/projects${q ? `?${q}` : ''}`)
  },
  getProject: (id: string) => request<Project>(`/projects/${id}`),
  createProject: (data: Partial<Project>) =>
    request<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: string, data: Partial<Project>) =>
    request<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id: string) =>
    request<void>(`/projects/${id}`, { method: 'DELETE' }),

  // Tasks
  getTasks: (params?: { projectId?: string; done?: string }) => {
    const q = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<Task[]>(`/tasks${q ? `?${q}` : ''}`)
  },
  createTask: (data: Partial<Task>) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: string, data: Partial<Task>) =>
    request<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (id: string) =>
    request<void>(`/tasks/${id}`, { method: 'DELETE' }),

  // Shipments
  getShipments: (params?: { projectId?: string; status?: string }) => {
    const q = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<Shipment[]>(`/shipments${q ? `?${q}` : ''}`)
  },
  createShipment: (data: Partial<Shipment>) =>
    request<Shipment>('/shipments', { method: 'POST', body: JSON.stringify(data) }),
  updateShipment: (id: string, data: Partial<Shipment>) =>
    request<Shipment>(`/shipments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteShipment: (id: string) =>
    request<void>(`/shipments/${id}`, { method: 'DELETE' }),
}

// ── Types ────────────────────────────────────────────

export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  instagram?: string
  facebook?: string
  preferredContact?: string
  notes?: string
  isVip: boolean
  orderCount: number
  lifetimeValue: number
  tags?: string
  createdAt: string
  updatedAt: string
  _count?: { projects: number; orders: number }
  projects?: Project[]
}

export interface Project {
  id: string
  title: string
  type: string
  status: string
  deadline?: string
  price?: number
  depositPaid: number
  notes?: string
  customerId?: string
  customer?: Pick<Customer, 'id' | 'name' | 'email'>
  tasks?: Task[]
  shipments?: Shipment[]
  createdAt: string
  updatedAt: string
  _count?: { tasks: number }
}

export interface Task {
  id: string
  title: string
  dueDate?: string
  priority: string
  done: boolean
  projectId?: string
  project?: Pick<Project, 'id' | 'title'>
  createdAt: string
  updatedAt: string
}

export interface Shipment {
  id: string
  carrier?: string
  trackingNumber?: string
  shipDate?: string
  deliveredDate?: string
  status: string
  recipientName?: string
  address?: string
  rawLabelText?: string
  projectId?: string
  project?: Pick<Project, 'id' | 'title'> & { customer?: Pick<Customer, 'name'> }
  createdAt: string
  updatedAt: string
}
