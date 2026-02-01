// Interfaces and Type Declarations
interface User {
  id: string;
  name: string;
  email?: string;
  roles: string[];
}

interface AdminUser extends User {
  permissions: Permission[];
  lastLogin?: Date;
}

type Permission = 'read' | 'write' | 'delete' | 'admin';

// Complex Union and Intersection Types
type Status = 'pending' | 'approved' | 'rejected';
type Priority = 'low' | 'medium' | 'high' | 'critical';

type Task = {
  id: string;
  title: string;
  status: Status;
} & ({
  priority: 'critical';
  assignee: string;
  deadline: Date;
} | {
  priority: Exclude<Priority, 'critical'>;
  assignee?: string;
  deadline?: Date;
});

// Namespace
namespace API {
  export interface Request {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    url: string;
    headers?: Record<string, string>;
  }

  export interface Response<T = any> {
    status: number;
    data: T;
    headers: Record<string, string>;
  }
}

// Enum
enum Color {
  Red = '#ff0000',
  Green = '#00ff00',
  Blue = '#0000ff'
}

// Type Guards
function isAdminUser(user: User): user is AdminUser {
  return 'permissions' in user;
}

// Implementation
const user: User = { id: '1', name: 'John', roles: ['user'] };
const task: Task = {
  id: '1',
  title: 'Test',
  status: 'pending',
  priority: 'low'
};

if (isAdminUser(user)) {
  console.log(user.permissions);
}