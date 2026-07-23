import { notFound } from "next/navigation";

import { getCustomerList } from "@/lib/customer";
import { getIndustriList } from "@/lib/industri";
import { getKaryawanDropdown } from "@/lib/karyawan";
import { getKontrakBiasaDropdown } from "@/lib/kontrak-biasa";
import { getPencairanList } from "@/lib/pencairan";
import { getProyekDetail, getProyekEligibleUnits } from "@/lib/proyek";
import { getProyekLogStatus } from "@/lib/proyek-log-status";
import { getProyekTags } from "@/lib/proyek-tags";
import { getTagihanByProyek } from "@/lib/tagihan";
import { getTagList } from "@/lib/tags";
import { getTeamMemberList } from "@/lib/team-member";
import { getUnitList } from "@/lib/unit";
import { getUnitShareList } from "@/lib/unit-share";
import { ProyekDetailView } from "./_components/proyek-detail-view";

export default async function ProyekDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proyekId = Number(id);
  if (!Number.isFinite(proyekId)) notFound();

  const [
    proyek,
    logStatus,
    unitShares,
    teamMembers,
    proyekTags,
    tagList,
    tagihanList,
    customerList,
    industriList,
    unitList,
    eligibleUnitOptions,
    picOptions,
    kontrakBiasaOptions,
  ] = await Promise.all([
    getProyekDetail(proyekId),
    getProyekLogStatus(proyekId),
    getUnitShareList(proyekId),
    getTeamMemberList(proyekId),
    getProyekTags(proyekId),
    getTagList(),
    getTagihanByProyek(proyekId),
    getCustomerList(),
    getIndustriList(),
    getUnitList(),
    getProyekEligibleUnits(),
    getKaryawanDropdown(),
    getKontrakBiasaDropdown(),
  ]);

  if (!proyek) notFound();

  const pencairanByTagihan = Object.fromEntries(
    await Promise.all(
      tagihanList.map(
        async (t) => [t.id, await getPencairanList(t.id)] as const,
      ),
    ),
  );

  return (
    <div className="space-y-4 p-6">
      <ProyekDetailView
        initialProyek={proyek}
        initialLogStatus={logStatus}
        initialUnitShares={unitShares}
        initialTeamMembers={teamMembers}
        initialProyekTags={proyekTags}
        tagOptions={tagList}
        initialTagihanList={tagihanList}
        initialPencairanByTagihan={pencairanByTagihan}
        customerOptions={customerList}
        industriOptions={industriList}
        unitOptions={unitList.filter((u) => u.status === "AKTIF")}
        eligibleUnitOptions={eligibleUnitOptions}
        picOptions={picOptions}
        kontrakBiasaOptions={kontrakBiasaOptions}
      />
    </div>
  );
}
