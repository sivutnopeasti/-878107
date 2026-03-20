"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [dbError, setDbError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u.name) {
          const timeout = setTimeout(() => {
            localStorage.removeItem("user");
            setDbError(true);
            setChecking(false);
          }, 5000);

          api.login(u.name)
            .then((data) => {
              clearTimeout(timeout);
              if (data) {
                localStorage.setItem("user", JSON.stringify(data));
                router.push(data.role === "ADMIN" ? "/admin" : "/worker");
              } else {
                localStorage.removeItem("user");
                setChecking(false);
              }
            })
            .catch(() => {
              clearTimeout(timeout);
              localStorage.removeItem("user");
              setChecking(false);
            });
          return;
        }
      } catch { /* ignore */ }
    }
    setChecking(false);
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await api.login(name.trim());
      if (!user) {
        setError("Käyttäjää ei löydy. Pyydä adminia lisäämään profiilisi.");
        return;
      }
      localStorage.setItem("user", JSON.stringify(user));
      router.push(user.role === "ADMIN" ? "/admin" : "/worker");
    } catch {
      setError("Virhe kirjautumisessa. Yritä uudelleen.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <div className="text-[#1B5E20] text-sm">Kirjaudutaan...</div>
          {dbError && (
            <div className="mt-4 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm max-w-sm">
              Yhteysvirhe tietokantaan. Tarkista Supabase-asetukset.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <img
              src="https://i.ibb.co/MkxWBYN8/pmvr-logo.png"
              alt="PMVR - Pohjanmaan Viherrakennus Oy"
              className="mx-auto mb-4 h-24 w-auto"
            />
            <p className="text-[#1B5E20] mt-1 font-medium">Työhallintajärjestelmä</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-[#1B5E20] mb-1"
              >
                Kirjaudu nimellä
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Syötä nimesi"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] transition-colors"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1B5E20] text-white py-3 rounded-lg font-medium hover:bg-[#145218] focus:ring-2 focus:ring-[#1B5E20] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Kirjaudutaan..." : "Kirjaudu"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
