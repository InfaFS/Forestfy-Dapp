import { useGlobalSaleNotifications } from "@/hooks/useGlobalSaleNotifications";

export function GlobalNotifications() {
  // Hook que escucha eventos de venta globalmente
  useGlobalSaleNotifications();
  
  // No renderiza nada, solo escucha eventos
  return null;
} 