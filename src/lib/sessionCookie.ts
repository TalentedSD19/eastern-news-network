// next-auth picks the session cookie's name from NEXTAUTH_URL in middleware but from the
// request URL in its API routes. Production sets AUTH_TRUST_HOST instead of NEXTAUTH_URL,
// so the two would disagree and the middleware would never find the session. Both use
// this instead: __Secure- cookies in production (always HTTPS), plain ones in `next dev`.
// Kept free of other imports because the middleware bundle includes it.
export const useSecureCookies = process.env.NODE_ENV === "production";

export const sessionCookieName = `${useSecureCookies ? "__Secure-" : ""}next-auth.session-token`;
