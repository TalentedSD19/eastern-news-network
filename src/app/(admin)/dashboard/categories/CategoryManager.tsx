"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Category = { id: string; name: string; slug: string };

export default function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setError("");
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setAdding(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to add category");
    } else {
      setCategories((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Failed to delete");
    } else {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Button type="submit" disabled={adding} className="bg-brand-red hover:bg-brand-red/90 text-white shrink-0">
          {adding ? "Adding…" : "Add"}
        </Button>
      </form>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <ul className="bg-white dark:bg-neutral-900 border border-transparent dark:border-white/10 rounded-lg shadow-sm divide-y dark:divide-white/10">
        {categories.map((cat) => (
          <li key={cat.id} className="flex items-center justify-between px-4 py-3">
            <span className="font-medium">{cat.name}</span>
            <Button variant="destructive" size="sm" onClick={() => handleDelete(cat.id)}>
              Delete
            </Button>
          </li>
        ))}
        {categories.length === 0 && (
          <li className="px-4 py-6 text-center text-gray-400 dark:text-gray-500 text-sm">No categories yet.</li>
        )}
      </ul>
    </div>
  );
}
