import { supabase } from "./supabase";

export interface User {
  id: number;
  name: string;
  role: "ADMIN" | "WORKER";
  createdAt: string;
}

export interface WorkHourEntry {
  id: number;
  hours: number;
  date: string;
  description: string;
  workType: "CUSTOMER" | "INTERNAL";
  user: { id: number; name: string };
  contract: {
    id: number;
    name: string;
    value: number | null;
    contractType: string;
    hourlyRates: Record<string, number>;
  };
}

export interface Contract {
  id: number;
  name: string;
  description: string;
  value: number | null;
  contractType: "FIXED" | "HOURLY";
  hourlyRates: Record<string, number>;
  status: "ACTIVE" | "COMPLETED";
  createdAt: string;
  workHours: Omit<WorkHourEntry, "contract">[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapContract(row: any): Contract {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    value: row.value ?? null,
    contractType: row.contract_type || "FIXED",
    hourlyRates: row.hourly_rates || {},
    status: row.status || "ACTIVE",
    createdAt: row.created_at,
    workHours: (row.work_hours || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (wh: any): Omit<WorkHourEntry, "contract"> => ({
        id: wh.id,
        hours: wh.hours,
        date: wh.date,
        description: wh.description || "",
        workType: wh.work_type || "CUSTOMER",
        user: { id: wh.users.id, name: wh.users.name },
      })
    ),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapWorkHour(row: any): WorkHourEntry {
  return {
    id: row.id,
    hours: row.hours,
    date: row.date,
    description: row.description || "",
    workType: row.work_type || "CUSTOMER",
    user: { id: row.users.id, name: row.users.name },
    contract: {
      id: row.contracts.id,
      name: row.contracts.name,
      value: row.contracts.value ?? null,
      contractType: row.contracts.contract_type || "FIXED",
      hourlyRates: row.contracts.hourly_rates || {},
    },
  };
}

export const api = {
  async login(name: string): Promise<User | null> {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("name", name.trim())
      .single();
    return data ? mapUser(data) : null;
  },

  async getContracts(): Promise<Contract[]> {
    const { data } = await supabase
      .from("contracts")
      .select("*, work_hours(*, users(id, name))")
      .order("created_at");
    return (data || []).map(mapContract);
  },

  async getWorkers(): Promise<User[]> {
    const { data } = await supabase.from("users").select("*").order("name");
    return (data || []).map(mapUser);
  },

  async createContract(name: string, description: string): Promise<{ error?: string }> {
    const { error } = await supabase
      .from("contracts")
      .insert({ name: name.trim(), description: description.trim() });
    return error ? { error: error.message } : {};
  },

  async updateContract(
    id: number,
    updates: {
      name?: string;
      description?: string;
      value?: number | null;
      status?: string;
      contractType?: string;
      hourlyRates?: Record<string, number>;
    }
  ): Promise<void> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.value !== undefined) dbUpdates.value = updates.value;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.contractType !== undefined) dbUpdates.contract_type = updates.contractType;
    if (updates.hourlyRates !== undefined) {
      const { data: existing } = await supabase
        .from("contracts")
        .select("hourly_rates")
        .eq("id", id)
        .single();
      const current = (existing?.hourly_rates as Record<string, number>) || {};
      dbUpdates.hourly_rates = { ...current, ...updates.hourlyRates };
    }
    await supabase.from("contracts").update(dbUpdates).eq("id", id);
  },

  async deleteContract(id: number): Promise<void> {
    await supabase.from("contracts").delete().eq("id", id);
  },

  async createWorker(name: string): Promise<{ error?: string; user?: User }> {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("name", name.trim())
      .maybeSingle();
    if (existing) return { error: "Tämän niminen käyttäjä on jo olemassa" };

    const { data, error } = await supabase
      .from("users")
      .insert({ name: name.trim(), role: "WORKER" })
      .select()
      .single();
    if (error) return { error: error.message };
    return { user: mapUser(data) };
  },

  async deleteWorker(id: number): Promise<void> {
    await supabase.from("users").delete().eq("id", id).neq("role", "ADMIN");
  },

  async getWorkHours(userId: number): Promise<WorkHourEntry[]> {
    const { data } = await supabase
      .from("work_hours")
      .select("*, users(id, name), contracts(id, name, value, contract_type, hourly_rates)")
      .eq("user_id", userId)
      .order("date", { ascending: false });
    return (data || []).map(mapWorkHour);
  },

  async createWorkHour(params: {
    userId: number;
    contractId: number;
    hours: number;
    date: string;
    description: string;
    workType: string;
  }): Promise<{ error?: string }> {
    const { error } = await supabase.from("work_hours").insert({
      user_id: params.userId,
      contract_id: params.contractId,
      hours: params.hours,
      date: params.date,
      description: params.description,
      work_type: params.workType,
    });
    return error ? { error: error.message } : {};
  },

  async updateWorkHour(
    id: number,
    updates: {
      hours?: number;
      date?: string;
      description?: string;
      workType?: string;
    }
  ): Promise<void> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.hours !== undefined) dbUpdates.hours = updates.hours;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.workType !== undefined) dbUpdates.work_type = updates.workType;
    await supabase.from("work_hours").update(dbUpdates).eq("id", id);
  },

  async deleteWorkHour(id: number): Promise<void> {
    await supabase.from("work_hours").delete().eq("id", id);
  },
};
