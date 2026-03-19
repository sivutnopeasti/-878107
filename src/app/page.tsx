"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u.name) {
          fetch("/api/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: u.name }),
          })
            .then((res) => {
              if (res.ok) return res.json();
              throw new Error();
            })
            .then((data) => {
              localStorage.setItem("user", JSON.stringify(data));
              router.push(data.role === "ADMIN" ? "/admin" : "/worker");
            })
            .catch(() => {
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
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      localStorage.setItem("user", JSON.stringify(data));

      if (data.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/worker");
      }
    } catch {
      setError("Virhe kirjautumisessa. Yritä uudelleen.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-[#1B5E20] text-sm">Kirjaudutaan...</div>
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
