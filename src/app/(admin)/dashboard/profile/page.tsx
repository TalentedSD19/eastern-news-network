import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/admin/ProfileForm";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, avatarUrl: true },
  });

  if (!user) redirect("/login");

  return (
    <div>
      <h1 className="font-display font-medium tracking-tight text-3xl mb-8">My Profile</h1>
      <ProfileForm initial={user} />
    </div>
  );
}
