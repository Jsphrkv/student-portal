import React, { useState, useEffect } from "react";
import {
  HelpCircle,
  //   Phone,
  //   Mail,
  //   MapPin,
  //   Clock,
  //   MessageCircle,
  //   Send,
  //   Search,
  //   ChevronDown,
  //   ChevronUp,
  Trash2,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../shared/LoadingSpinner";

interface SupportTicket {
  id: number;
  created_at: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "pending" | "resolved" | "rejected";
  response?: string;
  resolved_by?: string;
}

const SupportAdmin: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  );
  const [responseText, setResponseText] = useState("");
  const [activeTab, setActiveTab] = useState<
    "pending" | "resolved" | "rejected" | "all"
  >("pending");

  useEffect(() => {
    fetchTickets();
  }, [activeTab]);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      console.log("[DEBUG] Making query with params:", {
        table: "support_requests",
        filter: activeTab !== "all" ? { status: activeTab } : null,
        order: { column: "created_at", ascending: true },
      });

      let query = supabase
        .from("support_requests")
        .select("*")
        .order("created_at", { ascending: true }); // Changed to ASC

      if (activeTab !== "all") {
        query = query.eq("status", activeTab);
      }

      const { data, error, count } = await query;
      // Format dates in console for verification
      console.log(
        "Sample dates:",
        data?.map((item) => new Date(item.created_at).toISOString())
      );

      console.log("[DEBUG] Query results:", {
        data,
        error,
        count,
        isEmpty: data?.length === 0,
      });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("[ERROR] Fetch failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (
    ticketId: number,
    status: "resolved" | "rejected"
  ) => {
    try {
      const { error } = await supabase
        .from("support_requests")
        .update({
          status,
          response: responseText,
          resolved_by: user?.email,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", ticketId);

      if (error) throw error;
      await fetchTickets();
      setSelectedTicket(null);
      setResponseText("");
    } catch (error) {
      console.error("Error updating ticket:", error);
    }
  };

  const handleDelete = async (ticketId: number) => {
    if (window.confirm("Are you sure you want to delete this ticket?")) {
      try {
        const { error } = await supabase
          .from("support_requests")
          .delete()
          .eq("id", ticketId);

        if (error) throw error;
        await fetchTickets();
      } catch (error) {
        console.error("Error deleting ticket:", error);
      }
    }
  };

  const filteredTickets = requests.filter(
    (ticket) =>
      ticket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200";
      case "resolved":
        return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200";
      case "rejected":
        return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <AlertCircle className="h-4 w-4" />;
      case "resolved":
        return <Check className="h-4 w-4" />;
      case "rejected":
        return <X className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner size="lg" text="Loading support requests..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <HelpCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Support Center
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage and respond to support requests
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === "pending"
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setActiveTab("resolved")}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === "resolved"
                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Resolved
          </button>
          <button
            onClick={() => setActiveTab("rejected")}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === "rejected"
                ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Rejected
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === "all"
                ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            All Requests
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {ticket.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {ticket.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {ticket.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        ticket.status
                      )}`}
                    >
                      {getStatusIcon(ticket.status)}
                      <span className="ml-1 capitalize">{ticket.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(ticket.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredTickets.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <HelpCircle className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            No Requests found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm
              ? "No requests match your search"
              : `No ${activeTab} requests available`}
          </p>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-2xl border border-gray-200 dark:border-gray-700">
            <div className="mt-3">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Ticket #{selectedTicket.id}
                </h3>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      From
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {selectedTicket.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Email
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {selectedTicket.email}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Subject
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {selectedTicket.subject}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Message
                  </p>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-gray-900 dark:text-white whitespace-pre-line">
                      {selectedTicket.message}
                    </p>
                  </div>
                </div>

                {selectedTicket.response && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Admin Response
                    </p>
                    <div className="mt-1 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                      <p className="text-gray-900 dark:text-white whitespace-pre-line">
                        {selectedTicket.response}
                      </p>
                    </div>
                  </div>
                )}

                {selectedTicket.status === "pending" && (
                  <div>
                    <label
                      htmlFor="response"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Response
                    </label>
                    <textarea
                      id="response"
                      rows={4}
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter your response..."
                    />

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() =>
                          handleRespond(selectedTicket.id, "rejected")
                        }
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleRespond(selectedTicket.id, "resolved")
                        }
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportAdmin;
