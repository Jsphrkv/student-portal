import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../../lib/supabase";
import {
  Clock,
  User,
  AlertCircle,
  Edit3,
  Trash2,
  Plus,
  Eye,
  Bell,
} from "lucide-react";

// Audit Log Utility
const logAction = async ({
  userId,
  userRole,
  actionType,
  tableAffected,
  recordId,
  oldValues,
  newValues,
}: {
  userId?: string;
  userRole: string;
  actionType: string;
  tableAffected: string;
  recordId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
}) => {
  try {
    const { error } = await supabase.from("audit_logs").insert({
      user_id: userId,
      user_role: userRole,
      action_type: actionType,
      table_affected: tableAffected,
      record_id: recordId,
      old_values: oldValues,
      new_values: newValues,
    });

    if (error) {
      console.error("Error logging action:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to log action:", err);
    return false;
  }
};

// AuditTrail Component
interface AuditLog {
  id: number;
  user_id: string;
  user_role: string;
  action_type: string;
  table_affected: string;
  record_id: string;
  old_values: any;
  new_values: any;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export const AuditLogs: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        let query = supabase
          .from("audit_logs")
          .select(`*, user:users(first_name, last_name, email)`)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (user.role !== "admin") {
          query = query.eq("user_id", user.id);
        }

        const { data: logs, error } = await query;

        if (error) throw error;
        setLogs(logs || []);
      } catch (error) {
        console.error("Error fetching audit logs:", error);
        setError("Failed to load audit logs.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuditLogs();
  }, [user?.id, user?.role, limit]);

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "CREATE":
        return <Plus className="h-4 w-4" />;
      case "UPDATE":
        return <Edit3 className="h-4 w-4" />;
      case "DELETE":
        return <Trash2 className="h-4 w-4" />;
      case "READ":
        return <Eye className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatActionText = (log: AuditLog) => {
    const userName = log.user
      ? `${log.user.first_name} ${log.user.last_name}`
      : "System";
    return `${userName} (${log.user_role}) ${log.action_type.toLowerCase()}d ${
      log.table_affected
    }${log.record_id ? ` (ID: ${log.record_id})` : ""}`;
  };

  const formatJsonData = (data: any) => {
    if (!data) return null;
    return Object.entries(data).map(([key, value]) => (
      <div key={key} className="text-xs mt-1">
        <span className="font-medium">{key}:</span>{" "}
        <span className="text-gray-600 dark:text-gray-400">
          {JSON.stringify(value)}
        </span>
      </div>
    ));
  };

  if (!user) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
        Please log in to view this page.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Audit Trail
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {user.role === "admin"
                  ? "All system activities"
                  : "Your recent activities"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No audit logs available
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`flex-shrink-0 p-2 rounded-full ${
                    log.action_type === "CREATE"
                      ? "bg-green-100 dark:bg-green-900/20"
                      : log.action_type === "UPDATE"
                      ? "bg-blue-100 dark:bg-blue-900/20"
                      : log.action_type === "DELETE"
                      ? "bg-red-100 dark:bg-red-900/20"
                      : "bg-gray-100 dark:bg-gray-700"
                  }`}
                >
                  {getActionIcon(log.action_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatActionText(log)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {new Date(log.created_at).toLocaleString()}
                  </p>

                  {log.old_values && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Previous Values:
                      </p>
                      <div className="text-xs bg-gray-50 dark:bg-gray-700 p-2 rounded mt-1">
                        {formatJsonData(log.old_values)}
                      </div>
                    </div>
                  )}

                  {log.new_values && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        New Values:
                      </p>
                      <div className="text-xs bg-gray-50 dark:bg-gray-700 p-2 rounded mt-1">
                        {formatJsonData(log.new_values)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {logs.length >= limit && (
        <div className="flex justify-center">
          <button
            onClick={() => setLimit(limit + 10)}
            className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

// Example usage in other components
export const useAuditLog = () => {
  const { user } = useAuth();

  return {
    logAction: async (
      actionType: string,
      tableAffected: string,
      recordId?: string,
      oldValues?: Record<string, any>,
      newValues?: Record<string, any>
    ) => {
      await logAction({
        userId: user?.id,
        userRole: user?.role || "unknown",
        actionType,
        tableAffected,
        recordId,
        oldValues,
        newValues,
      });
    },
  };
};

export default AuditLogs;
