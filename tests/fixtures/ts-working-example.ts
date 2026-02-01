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

function createUser<T extends User>(data: Partial<T>): T {
  return {
    id: 'user_' + Date.now(),
    name: 'Default',
    ...data
  } as T;
}

function processUser(userData: any): User {
  const user = userData as User;
  return {
    id: user.id!,
    name: user.name,
    email: user.email || undefined
  };
}

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

export { User, Repository, createUser };