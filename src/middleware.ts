import { withAuth } from "next-auth/middleware";
import { sessionCookieName } from "@/lib/sessionCookie";

export default withAuth({
  cookies: { sessionToken: { name: sessionCookieName } },
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
