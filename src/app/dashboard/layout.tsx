import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { isDemoMode } from "@/lib/demo/mode";
import {
  getCompanyNotifications,
  getWorkspaceContext,
} from "@/lib/workspace";
import type { Notification } from "@/types/database";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getWorkspaceContext();
  if (!ctx) redirect("/login");

  const notifications = (await getCompanyNotifications(
    ctx.company.id
  )) as Notification[];

  return (
    <DashboardShell
      company={ctx.company}
      profileName={ctx.profileName}
      email={ctx.email}
      notifications={notifications}
      isDemo={isDemoMode()}
    >
      {children}
    </DashboardShell>
  );
}
