"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Customer } from "@/lib/customer";
import type { Industri } from "@/lib/industri";
import type { KaryawanDropdownItem } from "@/lib/karyawan";
import type { KontrakBiasaDropdownItem } from "@/lib/kontrak-biasa";
import type { Pencairan } from "@/lib/pencairan";
import type { Proyek, ProyekDetail, ProyekEligibleUnit } from "@/lib/proyek";
import type { ProyekLogStatus } from "@/lib/proyek-log-status";
import type { ProyekTag } from "@/lib/proyek-tags";
import {
  PROYEK_STATUS_LABEL,
  getProyekStatusBucket,
} from "@/lib/proyek-status";
import type { Tag } from "@/lib/tags";
import type { Tagihan } from "@/lib/tagihan";
import type { TeamMember } from "@/lib/team-member";
import type { Unit } from "@/lib/unit";
import type { UnitShare } from "@/lib/unit-share";
import { ProyekFormDialog } from "../../_components/proyek-form-dialog";
import { LogStatusTab } from "./log-status-tab";
import { StatusTagihanTab } from "./status-tagihan-tab";
import { TagihanTab } from "./tagihan-tab";
import { TagsTab } from "./tags-tab";
import { TeamMembersTab } from "./team-members-tab";
import { UnitShareTab } from "./unit-share-tab";

function formatRupiah(value: number) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
}

function formatTanggal(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

const BUCKET_DOT: Record<string, string> = {
  PELUANG: "bg-muted-foreground/50",
  PROSES: "bg-blue-500",
  DEAL: "bg-emerald-500",
  GAGAL: "bg-destructive",
};

export function ProyekDetailView({
  initialProyek,
  initialLogStatus,
  initialUnitShares,
  initialTeamMembers,
  initialProyekTags,
  tagOptions,
  initialTagihanList,
  initialPencairanByTagihan,
  customerOptions,
  industriOptions,
  unitOptions,
  eligibleUnitOptions,
  picOptions,
  kontrakBiasaOptions,
}: {
  initialProyek: ProyekDetail;
  initialLogStatus: ProyekLogStatus[];
  initialUnitShares: UnitShare[];
  initialTeamMembers: TeamMember[];
  initialProyekTags: ProyekTag[];
  tagOptions: Tag[];
  initialTagihanList: Tagihan[];
  initialPencairanByTagihan: Record<number, Pencairan[]>;
  customerOptions: Customer[];
  industriOptions: Industri[];
  unitOptions: Unit[];
  eligibleUnitOptions: ProyekEligibleUnit[];
  picOptions: KaryawanDropdownItem[];
  kontrakBiasaOptions: KontrakBiasaDropdownItem[];
}) {
  const [proyek, setProyek] = useState<ProyekDetail>(initialProyek);
  const [logStatus, setLogStatus] = useState(initialLogStatus);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("log-status");

  function handleProyekSaved(saved: Proyek) {
    setProyek((prev) => ({ ...prev, ...saved }));
  }

  const bucket = getProyekStatusBucket(proyek.status);

  return (
    <>
      <Link
        href="/proyek"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium"
      >
        <ArrowLeftIcon className="size-4" />
        Kembali ke Sales Unit
      </Link>

      <div className="bg-primary text-primary-foreground flex flex-wrap items-center justify-between gap-4 rounded-xl px-5 py-4">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-primary-foreground/60 text-xs font-semibold tracking-wide">
              PROYEK ID: #{proyek.id}
            </p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-lg font-bold">{proyek.kodeProyek}</p>
              <span className="bg-primary-foreground/10 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium">
                <span
                  className={cn("size-1.5 rounded-full", BUCKET_DOT[bucket])}
                />
                {PROYEK_STATUS_LABEL[proyek.status]}
              </span>
            </div>
            <p className="text-primary-foreground/70 text-xs">
              {proyek.namaProyek}
            </p>
          </div>

          <HeaderField label="Customer" value={proyek.customerNama ?? "—"} />
          <HeaderField
            label="Nilai Bersih"
            value={formatRupiah(proyek.nilaiBersih)}
          />
          <HeaderField label="PIC Sales" value={proyek.picSalesNama ?? "—"} />
          <HeaderField label="PMO" value={proyek.pmoNama ?? "—"} />
          <HeaderField
            label="Target Selesai"
            value={formatTanggal(proyek.targetSelesai)}
          />
          <HeaderField label="No. Kontrak" value={proyek.noKontrak ?? "—"} />
        </div>
        <Button
          variant="outline"
          className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent"
          onClick={() => setEditDialogOpen(true)}
        >
          <PencilIcon className="size-4" />
          Edit Proyek
        </Button>
      </div>

      <div className="rounded-xl border">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(String(v))}
          className="p-4"
        >
          <TabsList variant="line">
            <TabsTrigger value="log-status">Log Status</TabsTrigger>
            <TabsTrigger value="unit-share">Unit Share</TabsTrigger>
            <TabsTrigger value="team-members">Team Members</TabsTrigger>
            <TabsTrigger value="tagihan">Tagihan/Invoice</TabsTrigger>
            <TabsTrigger value="status-tagihan">Status Tagihan</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
          </TabsList>

          <TabsContent value="log-status" className="pt-4">
            <LogStatusTab
              proyek={proyek}
              logStatus={logStatus}
              onUpdated={(updatedProyek, entries) => {
                handleProyekSaved(updatedProyek);
                setLogStatus(entries);
              }}
            />
          </TabsContent>
          <TabsContent value="unit-share" className="pt-4">
            <UnitShareTab
              proyekId={proyek.id}
              nilaiProyek={proyek.nilaiProyek}
              initialShares={initialUnitShares}
              unitOptions={unitOptions}
            />
          </TabsContent>
          <TabsContent value="team-members" className="pt-4">
            <TeamMembersTab
              proyekId={proyek.id}
              kodeProyek={proyek.kodeProyek}
              initialMembers={initialTeamMembers}
              picOptions={picOptions}
            />
          </TabsContent>
          <TabsContent value="tagihan" className="pt-4">
            <TagihanTab
              proyekId={proyek.id}
              initialTagihanList={initialTagihanList}
              initialPencairanByTagihan={initialPencairanByTagihan}
            />
          </TabsContent>
          <TabsContent value="status-tagihan" className="pt-4">
            <StatusTagihanTab initialTagihanList={initialTagihanList} />
          </TabsContent>
          <TabsContent value="tags" className="pt-4">
            <TagsTab
              proyekId={proyek.id}
              initialTags={initialProyekTags}
              tagOptions={tagOptions}
            />
          </TabsContent>
        </Tabs>
      </div>

      <ProyekFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editing={proyek}
        defaultTahun={proyek.tahun}
        customerOptions={customerOptions}
        industriOptions={industriOptions}
        eligibleUnitOptions={eligibleUnitOptions}
        picOptions={picOptions}
        kontrakBiasaOptions={kontrakBiasaOptions}
        onSaved={handleProyekSaved}
      />
    </>
  );
}

function HeaderField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-primary-foreground/60 text-xs">{label}</p>
      <p className="text-sm font-semibold whitespace-nowrap">{value}</p>
    </div>
  );
}
