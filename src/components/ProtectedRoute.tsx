// src/components/ProtectedRoute.tsx
import React, { PropsWithChildren, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

/**
 * ProtectedRoute
 * Envuelve rutas que requieren autenticación.
 * Si no hay sesión activa, redirige a "/".
 */
export const ProtectedRoute: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      navigate("/", { replace: true });
    }
  }, [isLoggedIn, loading, navigate]);

  // Mientras loading, podrías mostrar spinner (aquí devolvemos null)
  if (loading) return null;

  return <>{children}</>;
};

export default ProtectedRoute;
