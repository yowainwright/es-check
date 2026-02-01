interface User {
  id: string;
  name: string;
  email?: string;
}

interface AdminUser extends User {
  permissions: string[];
}

type UserRole = 'admin' | 'user' | 'guest';

enum Status {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE'
}

class Repository<T extends { id: string }> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  findById(id: string): T | undefined {
    return this.items.find(item => item.id === id);
  }
}

function createEntity<T>(base: T, overrides: Partial<T>): T {
  return { ...base, ...overrides };
}

function processUserData(data: unknown): User {
  return data as User;
}

class UserService {
  constructor(private repo: Repository<User>) {}

  async getUser(id: string): Promise<User | null> {
    const user = this.repo.findById(id);
    return user || null;
  }

  createUser(name: string, email?: string): User {
    const user = createEntity<User>(
      { id: '', name: '', email: undefined },
      { id: Date.now().toString(), name, email }
    );
    this.repo.add(user);
    return user;
  }
}

const userRepo = new Repository<User>();
const service = new UserService(userRepo);

const newUser = service.createUser('John Doe', 'john@example.com');
console.log('Created user:', newUser.name);

service.getUser(newUser.id).then(user => {
  if (user) {
    console.log('Found user:', user.name);
  }
});

export { User, UserService, Repository };