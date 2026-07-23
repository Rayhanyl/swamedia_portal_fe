"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { toast } from "@/lib/toast-manager";
import type { ProyekTag } from "@/lib/proyek-tags";
import type { Tag } from "@/lib/tags";
import type { ApiResponse } from "@/types/api";

export function TagsTab({
  proyekId,
  initialTags,
  tagOptions,
}: {
  proyekId: number;
  initialTags: ProyekTag[];
  tagOptions: Tag[];
}) {
  const [tags, setTags] = useState(initialTags);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const availableOptions = tagOptions.filter(
    (t) => !tags.some((attached) => attached.tagsId === t.id),
  );

  async function handleAttach() {
    if (!selectedTagId) {
      toast.error("Pilih tag terlebih dahulu");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `/api/proxy/business/proyek/${proyekId}/tags/${selectedTagId}`,
        { method: "POST" },
      );
      const body: ApiResponse<ProyekTag[]> = await res.json();
      if (!res.ok || !body.success) {
        toast.error(body.message || "Gagal menambah tag");
        return;
      }
      setTags(body.data ?? []);
      setSelectedTagId(null);
      toast.success("Tag berhasil ditambahkan");
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setSaving(false);
    }
  }

  async function handleDetach(tagId: number) {
    try {
      const res = await fetch(
        `/api/proxy/business/proyek/${proyekId}/tags/${tagId}`,
        { method: "DELETE" },
      );
      const body: ApiResponse<ProyekTag[]> = await res.json();
      if (!res.ok || !body.success) {
        toast.error(body.message || "Gagal menghapus tag");
        return;
      }
      setTags(body.data ?? []);
    } catch {
      toast.error("Tidak dapat menghubungi server");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-wrap items-start gap-2">
        {tags.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Belum ada tag pada proyek ini.
          </p>
        ) : (
          tags.map((t) => (
            <span
              key={t.tagsId}
              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
            >
              {t.nama}
              <button
                type="button"
                onClick={() => handleDetach(t.tagsId)}
                title="Hapus tag"
                className="text-indigo-700/60 hover:text-destructive dark:text-indigo-300/60"
              >
                <XIcon className="size-3.5" />
              </button>
            </span>
          ))
        )}
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-sm font-semibold">Data Tags</p>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Tags</label>
          <SearchableSelect
            value={selectedTagId}
            onValueChange={setSelectedTagId}
            options={availableOptions.map((t) => ({
              value: t.id,
              label: `${t.kode} - ${t.nama}`,
            }))}
            placeholder="Pilih tag..."
          />
        </div>
        <Button onClick={handleAttach} disabled={saving} className="w-full">
          {saving ? "Menyimpan..." : "Tambah Tags"}
        </Button>
      </div>
    </div>
  );
}
