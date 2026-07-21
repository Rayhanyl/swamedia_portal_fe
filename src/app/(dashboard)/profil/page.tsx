import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";

import { getAkunSaya } from "@/lib/akun-saya";
import { getServerUser } from "@/lib/auth/server-user";
import { getUserDisplay } from "@/lib/auth/user-display";
import { AkunSayaForm } from "./_components/akun-saya-form";

export default async function ProfilSayaPage() {
  const [akun, user] = await Promise.all([getAkunSaya(), getServerUser()]);
  const display = getUserDisplay(user);

  const username = typeof user?.username === "string" ? user.username : "-";
  const roleName =
    typeof user?.swaportal_role_name === "string"
      ? user.swaportal_role_name
      : "-";

  return (
    <div className="space-y-2 p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div>
          <Card className="h-full">
            <CardContent className="flex h-full flex-col items-center justify-center gap-2 py-6 text-center">
              <Avatar className="size-20">
                <AvatarImage src={display.avatar} alt={display.name} />
                <AvatarFallback
                  className={`text-2xl font-semibold ${display.avatarColorClassName}`}
                >
                  {display.initials}
                </AvatarFallback>
              </Avatar>
              <p className="text-base font-semibold">{display.name}</p>
              {display.roleLabel && <Badge>{display.roleLabel}</Badge>}
              <p className="text-muted-foreground text-sm break-all">
                {display.email}
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardContent className="space-y-4">
              <p className="text-md font-semibold">INFORMASI AKUN</p>
              <div className="flex items-start gap-2 rounded-md bg-amber-100 p-3 text-amber-700">
                <Info className="h-4 w-4 shrink-0 translate-y-0.5" />
                <p className="text-sm">
                  Data akun dikelola di <b>WSO2 Identity Server</b>.
                </p>
              </div>
              <AkunSayaForm
                akun={akun}
                username={username}
                roleName={roleName}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
