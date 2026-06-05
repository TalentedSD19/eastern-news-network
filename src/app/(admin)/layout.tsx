import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: "Dashboard — Eastern News Network",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png" },
    other: [{ rel: "manifest", url: "/site.webmanifest" }],
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, avatarUrl: true },
  });

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <AdminSidebar
        userName={user?.name ?? session.user.name ?? "Admin"}
        avatarUrl={user?.avatarUrl ?? null}
      />
      <div className="flex-1 bg-gray-50 p-4 sm:p-6 md:p-8 overflow-auto">{children}</div>
    </div>
  );
}
