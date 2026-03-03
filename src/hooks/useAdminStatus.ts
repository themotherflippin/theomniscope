import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Checks admin status server-side via edge function.
 * Never exposes the admin code to the frontend.
 */
export function useAdminStatus(): { isAdmin: boolean; loading: boolean } {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const deviceId = localStorage.getItem("oracle_device_id");
    if (!deviceId) {
      setLoading(false);
      return;
    }

    supabase.functions
      .invoke("check-admin", { body: { deviceId } })
      .then(({ data }) => {
        if (data?.isAdmin === true) setIsAdmin(true);
      })
      .catch(() => {
        /* silent – not admin */
      })
      .finally(() => setLoading(false));
  }, []);

  return { isAdmin, loading };
}
