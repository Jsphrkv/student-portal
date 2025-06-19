// utils/logAction.ts
import { supabase } from "../lib/supabase";
import { v4 as uuidv4 } from "uuid";

interface LogParams {
  user_id?: string;
  action: string;
  module: string;
  ip_address?: string;
}

export const LogAction = async ({ user_id, action, module }: LogParams) => {
  try {
    const ip = await fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((data) => data.ip)
      .catch(() => null);

    const newId = uuidv4();

    const { error } = await supabase.from("audit_logs").insert([
      {
        id: newId,
        user_id: user_id,
        action: action,
        module: module,
        ip_address: ip,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Failed to log action:", error);
    }
  } catch (err) {
    console.error("Unexpected error logging action:", err);
  }
};
