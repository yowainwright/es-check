// Working TypeScript example that demonstrates complex features

interface User {
  id: string;
  name: string;
  email?: string;
}

type UserRole = 'admin' | 'user' | 'guest';

interface AdminUser extends User {
  role: UserRole;
  permissions: string[];
}

enum Status {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Pending = 'PENDING'
}

// Generic class with constraints
class Repository<T extends { id: string }> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  findById(id: string): T | undefined {
    return this.items.find(item => item.id === id);
  }

  getAll(): T[] {
    return [...this.items];
  }
}

// Function with generic parameters and return types
function createUser<T extends User>(data: Partial<T>): T {
  return {
    id: 'user_' + Date.now(),
    name: 'Default',
    ...data
  } as T;
}

// Type assertions and non-null assertions
function processUser(userData: any): User {
  const user = userData as User;
  return {
    id: user.id!,
    name: user.name,
    email: user.email || undefined
  };
}

// Usage with actual JavaScript functionality
const userRepo = new Repository();
const admin = createUser({
  name: 'Admin User',
  role: 'admin',
  permissions: ['read', 'write', 'delete']
});

userRepo.add(admin);
const foundUser = userRepo.findById(admin.id);

if (foundUser) {
  console.log('Found user:', foundUser.name);
}

// Export for module usage
export { User, Repository, createUser };