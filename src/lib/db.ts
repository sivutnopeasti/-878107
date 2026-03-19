import fs from "fs";
import path from "path";

interface User {
  id: number;
  name: string;
  role: "ADMIN" | "WORKER";
  createdAt: string;
}

interface Contract {
  id: number;
  name: string;
  description: string;
  value: number | null;
  status: "ACTIVE" | "COMPLETED";
  createdAt: string;
}

interface WorkHour {
  id: number;
  userId: number;
  contractId: number;
  hours: number;
  date: string;
  description: string;
  createdAt: string;
}

interface Database {
  users: User[];
  contracts: Contract[];
  workHours: WorkHour[];
  nextId: { users: number; contracts: number; workHours: number };
}

const DB_PATH = path.join(process.cwd(), "data", "db.json");

const DEFAULT_DB: Database = {
  users: [
    { id: 1, name: "Admin", role: "ADMIN", createdAt: new Date().toISOString() },
  ],
  contracts: [],
  workHours: [],
  nextId: { users: 2, contracts: 1, workHours: 1 },
};

function ensureDir() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function read(): Database {
  ensureDir();
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2));
    return structuredClone(DEFAULT_DB);
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function write(db: Database) {
  ensureDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export const db = {
  // Users
  getUsers(): User[] {
    return read().users;
  },

  getUserByName(name: string): User | undefined {
    return read().users.find((u) => u.name === name);
  },

  createUser(name: string, role: "ADMIN" | "WORKER" = "WORKER"): User {
    const data = read();
    const user: User = {
      id: data.nextId.users++,
      name,
      role,
      createdAt: new Date().toISOString(),
    };
    data.users.push(user);
    write(data);
    return user;
  },

  deleteUser(id: number): boolean {
    const data = read();
    const idx = data.users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    if (data.users[idx].role === "ADMIN") return false;
    data.users.splice(idx, 1);
    data.workHours = data.workHours.filter((wh) => wh.userId !== id);
    write(data);
    return true;
  },

  // Contracts
  getContracts(): Contract[] {
    return read().contracts;
  },

  createContract(name: string, description: string = ""): Contract {
    const data = read();
    const contract: Contract = {
      id: data.nextId.contracts++,
      name,
      description,
      value: null,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };
    data.contracts.push(contract);
    write(data);
    return contract;
  },

  updateContract(id: number, updates: Partial<Pick<Contract, "name" | "description" | "value" | "status">>): Contract | null {
    const data = read();
    const contract = data.contracts.find((c) => c.id === id);
    if (!contract) return null;
    if (updates.name !== undefined) contract.name = updates.name;
    if (updates.description !== undefined) contract.description = updates.description;
    if (updates.value !== undefined) contract.value = updates.value;
    if (updates.status !== undefined) contract.status = updates.status;
    write(data);
    return contract;
  },

  deleteContract(id: number): boolean {
    const data = read();
    const idx = data.contracts.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    data.contracts.splice(idx, 1);
    data.workHours = data.workHours.filter((wh) => wh.contractId !== id);
    write(data);
    return true;
  },

  // Work Hours
  getWorkHours(filters?: { userId?: number; contractId?: number }): (WorkHour & { user: User; contract: Contract })[] {
    const data = read();
    let hours = data.workHours;
    if (filters?.userId) hours = hours.filter((h) => h.userId === filters.userId);
    if (filters?.contractId) hours = hours.filter((h) => h.contractId === filters.contractId);

    return hours
      .map((h) => ({
        ...h,
        user: data.users.find((u) => u.id === h.userId)!,
        contract: data.contracts.find((c) => c.id === h.contractId)!,
      }))
      .filter((h) => h.user && h.contract)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  createWorkHour(userId: number, contractId: number, hours: number, date: string, description: string = ""): WorkHour | null {
    const data = read();
    if (!data.users.find((u) => u.id === userId)) return null;
    if (!data.contracts.find((c) => c.id === contractId)) return null;

    const workHour: WorkHour = {
      id: data.nextId.workHours++,
      userId,
      contractId,
      hours,
      date,
      description,
      createdAt: new Date().toISOString(),
    };
    data.workHours.push(workHour);
    write(data);
    return workHour;
  },

  deleteWorkHour(id: number): boolean {
    const data = read();
    const idx = data.workHours.findIndex((wh) => wh.id === id);
    if (idx === -1) return false;
    data.workHours.splice(idx, 1);
    write(data);
    return true;
  },

  getContractsWithHours() {
    const data = read();
    return data.contracts.map((c) => ({
      ...c,
      workHours: data.workHours
        .filter((wh) => wh.contractId === c.id)
        .map((wh) => ({
          ...wh,
          user: data.users.find((u) => u.id === wh.userId)!,
        }))
        .filter((wh) => wh.user),
    }));
  },
};
