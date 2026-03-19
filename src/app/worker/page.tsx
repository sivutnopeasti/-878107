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
  status: string;
  workHours: WorkHourEntry[];
}

interface WorkHourEntry {
  id: number;
  hours: number;
  date: string;
  description: string;
  contract: { id: number; name: string; value: number | null };
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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchMyHours = useCallback(async (userId: number) => {
    const res = await fetch(`/api/workhours?userId=${userId}`);
    const data = await res.json();
    setMyHours(data);
  }, []);

  const fetchContracts = useCallback(async () => {
    const res = await fetch("/api/contracts");
    const data = await res.json();
    setContracts(data.filter((c: Contract) => c.status === "ACTIVE"));
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/");
      return;
    }
    const u = JSON.parse(stored);
    if (u.role !== "WORKER") {
      router.push("/");
      return;
    }
    setUser(u);
    fetchContracts();
    fetchMyHours(u.id);
  }, [router, fetchContracts, fetchMyHours]);

  const handleAddHours = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!selectedContract || !hours || !date) {
      setError("Täytä kaikki kentät");
      return;
    }

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
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error);
        return;
      }

      setMessage("Työtunnit lisätty!");
      setHours("");
      setDescription("");
      fetchMyHours(user!.id);
      fetchContracts();
    } catch {
      setError("Virhe työtuntien lisäämisessä");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  const calculateHourlyWage = (contract: {
    value: number | null;
    id: number;
  }) => {
    if (!contract.value) return null;
    const totalHours = myHours
      .filter((h) => h.contract.id === contract.id)
      .reduce((sum, h) => sum + h.hours, 0);
    if (totalHours === 0) return null;

    const allContractData = contracts.find((c) => c.id === contract.id);
    const allHours =
      allContractData?.workHours.reduce(
        (sum: number, h: { hours: number }) => sum + h.hours,
        0
      ) || 0;
    if (allHours === 0) return null;

    return contract.value / allHours;
  };

  const totalMyHoursForContract = (contractId: number) =>
    myHours
      .filter((h) => h.contract.id === contractId)
      .reduce((sum, h) => sum + h.hours, 0);

  if (!user) return null;

  const groupedByContract = myHours.reduce(
    (acc, h) => {
      const key = h.contract.id;
      if (!acc[key]) acc[key] = { contract: h.contract, hours: [] };
      acc[key].hours.push(h);
      return acc;
    },
    {} as Record<
      number,
      { contract: WorkHourEntry["contract"]; hours: WorkHourEntry[] }
    >
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-green-700">
              Pohjanmaan Viherrakennus
            </h1>
            <p className="text-sm text-gray-500">
              Kirjautunut: <span className="font-medium">{user.name}</span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Kirjaudu ulos
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Lisää työtunteja</h2>
          <form onSubmit={handleAddHours} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Urakka
                </label>
                <select
                  value={selectedContract}
                  onChange={(e) => setSelectedContract(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">Valitse urakka...</option>
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tunnit
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="esim. 7.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Päivämäärä
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kuvaus (valinnainen)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mitä teit?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}
            {message && (
              <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Lisää tunnit
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Omat työtunnit</h2>

          {Object.keys(groupedByContract).length === 0 ? (
            <p className="text-gray-500 text-sm">
              Ei vielä kirjattuja työtunteja.
            </p>
          ) : (
            <div className="space-y-6">
              {Object.values(groupedByContract).map(
                ({ contract, hours: contractHours }) => {
                  const hourlyWage = calculateHourlyWage(contract);
                  const myTotal = totalMyHoursForContract(contract.id);

                  return (
                    <div
                      key={contract.id}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{contract.name}</h3>
                          <p className="text-sm text-gray-500">
                            Omat tunnit yhteensä:{" "}
                            <span className="font-medium">{myTotal} h</span>
                            {hourlyWage !== null && (
                              <>
                                {" "}
                                &middot; Tuntipalkka:{" "}
                                <span className="font-medium text-green-700">
                                  {hourlyWage.toFixed(2)} €/h
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 text-left text-gray-500">
                            <th className="px-4 py-2 font-medium">
                              Päivämäärä
                            </th>
                            <th className="px-4 py-2 font-medium">Tunnit</th>
                            <th className="px-4 py-2 font-medium">Kuvaus</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contractHours.map((h) => (
                            <tr
                              key={h.id}
                              className="border-b border-gray-100"
                            >
                              <td className="px-4 py-2">{h.date}</td>
                              <td className="px-4 py-2">{h.hours} h</td>
                              <td className="px-4 py-2 text-gray-500">
                                {h.description || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
