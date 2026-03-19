"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  name: string;
  role: string;
}

interface Contract {
  id: number;
  name: string;
  description: string;
  value: number | null;
  contractType: string;
  hourlyRates: Record<string, number>;
  status: string;
  workHours: WorkHourEntry[];
}

interface WorkHourEntry {
  id: number;
  hours: number;
  date: string;
  description: string;
  workType: string;
  contract: { id: number; name: string; value: number | null; contractType: string; hourlyRates: Record<string, number> };
  user: { id: number; name: string };
}

export default function WorkerPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [myHours, setMyHours] = useState<WorkHourEntry[]>([]);
  const [selectedContract, setSelectedContract] = useState("");
  const [hours, setHours] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [workType, setWorkType] = useState<"CUSTOMER" | "INTERNAL">("CUSTOMER");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editHours, setEditHours] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editWorkType, setEditWorkType] = useState<"CUSTOMER" | "INTERNAL">("CUSTOMER");

  const fetchMyHours = useCallback(async (userId: number) => {
    const res = await fetch(`/api/workhours?userId=${userId}`);
    setMyHours(await res.json());
  }, []);

  const fetchContracts = useCallback(async () => {
    const res = await fetch("/api/contracts");
    const data = await res.json();
    setContracts(data.filter((c: Contract) => c.status === "ACTIVE"));
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/"); return; }
    const u = JSON.parse(stored);
    if (u.role !== "WORKER") { router.push("/"); return; }
    setUser(u);
    fetchContracts();
    fetchMyHours(u.id);
  }, [router, fetchContracts, fetchMyHours]);

  const handleAddHours = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMessage("");
    if (!selectedContract || !hours || !date) { setError("Täytä kaikki kentät"); return; }
    try {
      const res = await fetch("/api/workhours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user!.id,
          contractId: Number(selectedContract),
          hours: Number(hours),
          date,
          description,
          workType,
        }),
      });
      if (!res.ok) { setError((await res.json()).error); return; }
      setMessage("Työtunnit lisätty!");
      setHours(""); setDescription("");
      setTimeout(() => setMessage(""), 3000);
      fetchMyHours(user!.id);
      fetchContracts();
    } catch { setError("Virhe työtuntien lisäämisessä"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Haluatko varmasti poistaa tämän tuntimerkinnän?")) return;
    await fetch(`/api/workhours?id=${id}`, { method: "DELETE" });
    fetchMyHours(user!.id);
    fetchContracts();
  };

  const startEdit = (h: WorkHourEntry) => {
    setEditingId(h.id);
    setEditHours(String(h.hours));
    setEditDate(h.date);
    setEditDescription(h.description);
    setEditWorkType(h.workType as "CUSTOMER" | "INTERNAL");
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    await fetch("/api/workhours", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId,
        hours: Number(editHours),
        date: editDate,
        description: editDescription,
        workType: editWorkType,
      }),
    });
    setEditingId(null);
    fetchMyHours(user!.id);
    fetchContracts();
  };

  const handleLogout = () => { localStorage.removeItem("user"); router.push("/"); };

  const calculateHourlyWage = (contract: WorkHourEntry["contract"]) => {
    if (contract.contractType === "HOURLY") {
      const defaultRate = contract.hourlyRates["default"] || 40;
      return contract.hourlyRates[String(user!.id)] || defaultRate;
    }
    if (!contract.value) return null;
    const allContractData = contracts.find((c) => c.id === contract.id);
    const allHours = allContractData?.workHours
      .filter((h) => h.workType === "CUSTOMER")
      .reduce((sum: number, h: { hours: number }) => sum + h.hours, 0) || 0;
    if (allHours === 0) return null;
    return contract.value / allHours;
  };

  const totalMyHoursForContract = (contractId: number, type?: string) =>
    myHours
      .filter((h) => h.contract.id === contractId && (!type || h.workType === type))
      .reduce((sum, h) => sum + h.hours, 0);

  if (!user) return null;

  const groupedByContract = myHours.reduce(
    (acc, h) => {
      const key = h.contract.id;
      if (!acc[key]) acc[key] = { contract: h.contract, hours: [] };
      acc[key].hours.push(h);
      return acc;
    },
    {} as Record<number, { contract: WorkHourEntry["contract"]; hours: WorkHourEntry[] }>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="https://i.ibb.co/MkxWBYN8/pmvr-logo.png" alt="PMVR" className="h-10 w-auto" />
            <div className="border-l border-gray-200 pl-4">
              <p className="text-sm text-gray-500">
                Kirjautunut: <span className="font-medium text-[#1B5E20]">{user.name}</span>
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            Kirjaudu ulos
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-[#1B5E20] mb-4">Lisää työtunteja</h2>
          <form onSubmit={handleAddHours} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1B5E20] mb-1">Urakka</label>
                <select value={selectedContract} onChange={(e) => setSelectedContract(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20]" required>
                  <option value="">Valitse urakka...</option>
                  {contracts.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1B5E20] mb-1">Tunnit</label>
                <input type="number" step="0.25" min="0.25" value={hours} onChange={(e) => setHours(e.target.value)}
                  placeholder="esim. 7.5" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20]" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1B5E20] mb-1">Päivämäärä</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20]" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1B5E20] mb-1">Kuvaus (valinnainen)</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mitä teit?" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20]" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1B5E20] mb-2">Työn tyyppi</label>
              <div className="flex gap-4">
                <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${workType === "CUSTOMER" ? "border-[#1B5E20] bg-[#E8F5E9] text-[#1B5E20]" : "border-gray-300 text-gray-600"}`}>
                  <input type="radio" name="workType" value="CUSTOMER" checked={workType === "CUSTOMER"} onChange={() => setWorkType("CUSTOMER")} className="sr-only" />
                  <span className="text-sm font-medium">Asiakastyö</span>
                </label>
                <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${workType === "INTERNAL" ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-300 text-gray-600"}`}>
                  <input type="radio" name="workType" value="INTERNAL" checked={workType === "INTERNAL"} onChange={() => setWorkType("INTERNAL")} className="sr-only" />
                  <span className="text-sm font-medium">Sisäinen työ / huolto</span>
                </label>
              </div>
              {workType === "INTERNAL" && (
                <p className="text-xs text-orange-600 mt-1">Sisäisestä työstä ei makseta palkkaa.</p>
              )}
            </div>

            {error && <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>}
            {message && <div className="bg-[#E8F5E9] text-[#1B5E20] px-4 py-2 rounded-lg text-sm">{message}</div>}

            <button type="submit" className="bg-[#1B5E20] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#145218] transition-colors">
              Lisää tunnit
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-[#1B5E20] mb-4">Omat työtunnit</h2>

          {Object.keys(groupedByContract).length === 0 ? (
            <p className="text-gray-500 text-sm">Ei vielä kirjattuja työtunteja.</p>
          ) : (
            <div className="space-y-6">
              {Object.values(groupedByContract).map(({ contract, hours: contractHours }) => {
                const hourlyWage = calculateHourlyWage(contract);
                const myCustomer = totalMyHoursForContract(contract.id, "CUSTOMER");
                const myInternal = totalMyHoursForContract(contract.id, "INTERNAL");

                return (
                  <div key={contract.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3">
                      <h3 className="font-medium text-[#1B5E20]">{contract.name}</h3>
                      <p className="text-sm text-gray-500">
                        Asiakastyö: <span className="font-medium">{myCustomer} h</span>
                        {myInternal > 0 && (<> &middot; Sisäinen: <span className="font-medium text-orange-600">{myInternal} h</span></>)}
                        {hourlyWage !== null && myCustomer > 0 && (
                          <> &middot; Tuntipalkka: <span className="font-medium text-[#1B5E20]">{hourlyWage.toFixed(2)} €/h</span>
                          {contract.contractType === "FIXED" && <> &middot; Ansaittu: <span className="font-medium text-[#1B5E20]">{(myCustomer * hourlyWage).toFixed(2)} €</span></>}
                          </>
                        )}
                      </p>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-gray-500">
                          <th className="px-4 py-2 font-medium">Päivämäärä</th>
                          <th className="px-4 py-2 font-medium">Tunnit</th>
                          <th className="px-4 py-2 font-medium">Tyyppi</th>
                          <th className="px-4 py-2 font-medium">Kuvaus</th>
                          <th className="px-4 py-2 font-medium text-right">Toiminnot</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contractHours.map((h) => (
                          <tr key={h.id} className="border-b border-gray-100">
                            {editingId === h.id ? (
                              <>
                                <td className="px-4 py-2">
                                  <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm w-full" />
                                </td>
                                <td className="px-4 py-2">
                                  <input type="number" step="0.25" min="0.25" value={editHours} onChange={(e) => setEditHours(e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm w-20" />
                                </td>
                                <td className="px-4 py-2">
                                  <select value={editWorkType} onChange={(e) => setEditWorkType(e.target.value as "CUSTOMER" | "INTERNAL")} className="px-2 py-1 border border-gray-300 rounded text-sm">
                                    <option value="CUSTOMER">Asiakas</option>
                                    <option value="INTERNAL">Sisäinen</option>
                                  </select>
                                </td>
                                <td className="px-4 py-2">
                                  <input type="text" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm w-full" />
                                </td>
                                <td className="px-4 py-2 text-right space-x-1">
                                  <button onClick={handleSaveEdit} className="text-xs text-[#1B5E20] hover:text-[#145218] font-medium px-2 py-1 rounded hover:bg-[#E8F5E9]">Tallenna</button>
                                  <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1">Peruuta</button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-4 py-2">{h.date}</td>
                                <td className="px-4 py-2">{h.hours} h</td>
                                <td className="px-4 py-2">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${h.workType === "INTERNAL" ? "bg-orange-50 text-orange-700" : "bg-[#E8F5E9] text-[#1B5E20]"}`}>
                                    {h.workType === "INTERNAL" ? "Sisäinen" : "Asiakas"}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-gray-500">{h.description || "-"}</td>
                                <td className="px-4 py-2 text-right space-x-1">
                                  <button onClick={() => startEdit(h)} className="text-xs text-[#1B5E20] hover:text-[#145218] px-2 py-1 rounded hover:bg-[#E8F5E9]">Muokkaa</button>
                                  <button onClick={() => handleDelete(h.id)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">Poista</button>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
