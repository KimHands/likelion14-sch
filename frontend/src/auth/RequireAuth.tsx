import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import type { Role } from "./types";
import type { ReactNode } from "react";

export default function RequireAuth({
  allow,
  children,
  skipEmailVerified,
}: {
  allow?: Role[];
  children: ReactNode;
  skipEmailVerified?: boolean;
}) {
  const { me, loading } = useAuth();

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!me) return <Navigate to="/login" replace />;

  if (!skipEmailVerified && !me.email_verified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (allow && !allow.includes(me.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}