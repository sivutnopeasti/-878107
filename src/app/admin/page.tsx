"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface User {
  id: number;
  name: string;
  role: string;
}

interface WorkHourEntry {
  id: number;
  hours: number;
  date: string;
  description: string;
  user: { id: number; name: string };
}

interface Contract {
  id: number;
  name: string;
  description: string;
  value: number | null;
  status: string;
  workHours: WorkHourEntry[];
}

type Tab = "contracts" | "workers" | "hours";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>("contracts");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);

  const [newContractName, setNewContractName] = useState("");
  const [newContractDesc, setNewContractDesc] = useState("");
  const [newWorkerName, setNewWorkerName] = useState("");
  const [editingValueId, setEditingValueId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchContracts = useCallback(async () => {
    const res = await fetch("/api/contracts");
    setContracts(await res.json());
  }, []);

  const fetchWorkers = useCallback(async () => {
    const res = await fetch("/api/workers");
    setWorkers(await res.json());
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/");
      return;
    }
    const u = JSON.parse(stored);
    if (u.role !== "ADMIN") {
      router.push("/");
      return;
    }
    setUser(u);
    fetchContracts();
    fetchWorkers();
  }, [router, fetchContracts, fetchWorkers]);

  const showMsg = (msg: string) => {
    setMessage(msg);
    setError("");
    setTimeout(() => setMessage(""), 3000);
  };

  const showErr = (msg: string) => {
    setError(msg);
    setMessage("");
  };

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContractName.trim()) return;
    const res = await fetch("/api/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newContractName,
        description: newContractDesc,
      }),
    });
    if (res.ok) {
      showMsg("Urakka lisätty!");
      setNewContractName("");
      setNewContractDesc("");
      fetchContracts();
    } else {
      const data = await res.json();
      showErr(data.error);
    }
  };

  const handleDeleteContract = async (id: number) => {
    if (!confirm("Haluatko varmasti poistaa tämän urakan ja kaikki sen työtunnit?")) return;
    await fetch(`/api/contracts?id=${id}`, { method: "DELETE" });
    showMsg("Urakka poistettu");
    fetchContracts();
  };

  const handleSetValue = async (id: number) => {
    const value = editValue === "" ? null : Number(editValue);
    await fetch("/api/contracts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, value }),
    });
    setEditingValueId(null);
    setEditValue("");
    showMsg("Urakan arvo päivitetty!");
    fetchContracts();
  };

  const handleToggleStatus = async (contract: Contract) => {
    const newStatus = contract.status === "ACTIVE" ? "COMPLETED" : "ACTIVE";
    await fetch("/api/contracts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: contract.id, status: newStatus }),
    });
    showMsg(
      `Urakka merkitty ${newStatus === "COMPLETED" ? "valmiiksi" : "aktiiviseksi"}`
    );
    fetchContracts();
  };

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerName.trim()) return;
    const res = await fetch("/api/workers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newWorkerName }),
    });
    if (res.ok) {
      showMsg("Työntekijä lisätty!");
      setNewWorkerName("");
      fetchWorkers();
    } else {
      const data = await res.json();
      showErr(data.error);
    }
  };

  const handleDeleteWorker = async (id: number) => {
    if (!confirm("Haluatko varmasti poistaa tämän työntekijän ja kaikki hänen työtuntinsa?")) return;
    await fetch(`/api/workers?id=${id}`, { method: "DELETE" });
    showMsg("Työntekijä poistettu");
    fetchWorkers();
    fetchContracts();
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  if (!user) return null;

  const totalHoursForContract = (contract: Contract) =>
    contract.workHours.reduce((sum, h) => sum + h.hours, 0);

  const hourlyWageForContract = (contract: Contract) => {
    if (!contract.value) return null;
    const total = totalHoursForContract(contract);
    if (total === 0) return null;
    return contract.value / total;
  };

  const hoursByWorker = (contract: Contract) => {
    const grouped: Record<string, { name: string; total: number }> = {};
    for (const h of contract.workHours) {
      if (!grouped[h.user.id]) {
        grouped[h.user.id] = { name: h.user.name, total: 0 };
      }
      grouped[h.user.id].total += h.hours;
    }
    return Object.values(grouped);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "contracts", label: "Urakat" },
    { key: "workers", label: "Työntekijät" },
    { key: "hours", label: "Kaikki tunnit" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/logo.svg" alt="PMVR" width={120} height={40} priority />
            <div className="border-l border-gray-200 pl-4">
              <p className="text-sm text-[#1B5E20] font-medium">Admin-hallinta</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Kirjaudu ulos
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {message && (
          <div className="mb-4 bg-[#E8F5E9] text-[#1B5E20] px-4 py-2 rounded-lg text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-1 mb-6 bg-white rounded-lg p-1 shadow-sm border border-gray-200 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-[#1B5E20] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "contracts" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-[#1B5E20] mb-4">Lisää uusi urakka</h2>
              <form
                onSubmit={handleAddContract}
                className="flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="text"
                  value={newContractName}
                  onChange={(e) => setNewContractName(e.target.value)}
                  placeholder="Urakan nimi"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20]"
                  required
                />
                <input
                  type="text"
                  value={newContractDesc}
                  onChange={(e) => setNewContractDesc(e.target.value)}
                  placeholder="Kuvaus (valinnainen)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20]"
                />
                <button
                  type="submit"
                  className="bg-[#1B5E20] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#145218] transition-colors whitespace-nowrap"
                >
                  Lisää urakka
                </button>
              </form>
            </div>

            <div className="space-y-4">
              {contracts.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-gray-500">
                  Ei vielä urakoita. Lisää ensimmäinen urakka yllä.
                </div>
              ) : (
                contracts.map((contract) => {
                  const total = totalHoursForContract(contract);
                  const wage = hourlyWageForContract(contract);
                  const workerBreakdown = hoursByWorker(contract);

                  return (
                    <div
                      key={contract.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-[#1B5E20]">
                                {contract.name}
                              </h3>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  contract.status === "ACTIVE"
                                    ? "bg-[#E8F5E9] text-[#1B5E20]"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {contract.status === "ACTIVE"
                                  ? "Aktiivinen"
                                  : "Valmis"}
                              </span>
                            </div>
                            {contract.description && (
                              <p className="text-sm text-gray-500 mt-1">
                                {contract.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToggleStatus(contract)}
                              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                            >
                              {contract.status === "ACTIVE"
                                ? "Merkitse valmiiksi"
                                : "Aktivoi"}
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteContract(contract.id)
                              }
                              className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                            >
                              Poista
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              Urakan arvo
                            </p>
                            {editingValueId === contract.id ? (
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editValue}
                                  onChange={(e) =>
                                    setEditValue(e.target.value)
                                  }
                                  placeholder="€"
                                  className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                                  autoFocus
                                />
                                <button
                                  onClick={() =>
                                    handleSetValue(contract.id)
                                  }
                                  className="text-xs text-[#1B5E20] hover:text-[#145218] font-medium"
                                >
                                  Tallenna
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingValueId(null);
                                    setEditValue("");
                                  }}
                                  className="text-xs text-gray-400 hover:text-gray-600"
                                >
                                  Peruuta
                                </button>
                              </div>
                            ) : (
                              <p
                                className="text-lg font-semibold mt-1 cursor-pointer hover:text-[#1B5E20]"
                                onClick={() => {
                                  setEditingValueId(contract.id);
                                  setEditValue(
                                    contract.value?.toString() || ""
                                  );
                                }}
                              >
                                {contract.value
                                  ? `${contract.value.toLocaleString("fi-FI")} €`
                                  : "Ei asetettu"}
                                <span className="text-xs text-gray-400 ml-1">
                                  (muokkaa)
                                </span>
                              </p>
                            )}
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              Työtunnit yhteensä
                            </p>
                            <p className="text-lg font-semibold mt-1">
                              {total} h
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              Tuntipalkka
                            </p>
                            <p className="text-lg font-semibold mt-1 text-[#1B5E20]">
                              {wage
                                ? `${wage.toFixed(2)} €/h`
                                : "–"}
                            </p>
                          </div>
                        </div>

                        {workerBreakdown.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                              Tunnit työntekijöittäin
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {workerBreakdown.map((w) => (
                                <span
                                  key={w.name}
                                  className="text-xs bg-[#E8F5E9] text-[#1B5E20] px-2 py-1 rounded"
                                >
                                  {w.name}: {w.total} h
                                  {wage && (
                                    <span className="text-[#2E7D32] ml-1">
                                      ({(w.total * wage).toFixed(2)} €)
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {tab === "workers" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-[#1B5E20] mb-4">
                Lisää uusi työntekijä
              </h2>
              <form
                onSubmit={handleAddWorker}
                className="flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="text"
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                  placeholder="Työntekijän nimi"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20]"
                  required
                />
                <button
                  type="submit"
                  className="bg-[#1B5E20] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#145218] transition-colors whitespace-nowrap"
                >
                  Lisää työntekijä
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left bg-gray-50">
                    <th className="px-4 py-3 font-medium text-gray-500">
                      Nimi
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-500">
                      Rooli
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-500 text-right">
                      Toiminnot
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((w) => (
                    <tr key={w.id} className="border-b border-gray-100">
                      <td className="px-4 py-3 font-medium">{w.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            w.role === "ADMIN"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-[#E8F5E9] text-[#1B5E20]"
                          }`}
                        >
                          {w.role === "ADMIN" ? "Admin" : "Työntekijä"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {w.role !== "ADMIN" && (
                          <button
                            onClick={() => handleDeleteWorker(w.id)}
                            className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                          >
                            Poista
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "hours" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-[#1B5E20]">Kaikki työtunnit</h2>
            </div>
            {contracts.flatMap((c) => c.workHours).length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                Ei vielä kirjattuja työtunteja.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="px-4 py-2 font-medium">Päivämäärä</th>
                    <th className="px-4 py-2 font-medium">Työntekijä</th>
                    <th className="px-4 py-2 font-medium">Urakka</th>
                    <th className="px-4 py-2 font-medium">Tunnit</th>
                    <th className="px-4 py-2 font-medium">Kuvaus</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts
                    .flatMap((c) =>
                      c.workHours.map((h) => ({
                        ...h,
                        contractName: c.name,
                      }))
                    )
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() -
                        new Date(a.date).getTime()
                    )
                    .map((h) => (
                      <tr
                        key={h.id}
                        className="border-b border-gray-100"
                      >
                        <td className="px-4 py-2">{h.date}</td>
                        <td className="px-4 py-2 font-medium">
                          {h.user.name}
                        </td>
                        <td className="px-4 py-2">{h.contractName}</td>
                        <td className="px-4 py-2">{h.hours} h</td>
                        <td className="px-4 py-2 text-gray-500">
                          {h.description || "-"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
