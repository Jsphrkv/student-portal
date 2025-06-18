import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Bell, Plus, Edit3, Trash2, Calendar, AlertCircle } from "lucide-react";
import { supabase } from "../../../lib/supabase";

interface Announcement {
  id: number;
  title: string;
  content: string;
  created_at: string;
  priority: "high" | "medium" | "low";
  author: string;
}

const Announcements: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "medium" as "high" | "medium" | "low",
  });

  const getAuthorName = (user: any) => {
    if (!user) return "Admin";
    const firstName = user.first_name || "";
    const lastName = user.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || "Admin";
  };

  // Fetch announcements and set up realtime subscription
  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch all announcements
        const { data: announcements, error: announcementsError } =
          await supabase
            .from("announcements")
            .select("*")
            .order("created_at", { ascending: false });

        if (announcementsError) throw announcementsError;

        // Fetch author details for each announcement
        const announcementsWithAuthors = await Promise.all(
          (announcements || []).map(async (announcement) => {
            // If author is stored as user_id, fetch user details
            if (announcement.author_id) {
              const { data: author, error: authorError } = await supabase
                .from("users")
                .select("first_name, last_name")
                .eq("id", announcement.author_id)
                .single();

              if (!authorError && author) {
                return {
                  ...announcement,
                  author: `${author.first_name} ${author.last_name}`,
                };
              }
            }
            return announcement;
          })
        );

        setAnnouncements(announcementsWithAuthors || []);

        // If admin, fetch additional data like views or statistics
        if (isAdmin) {
          const { data: stats, error: statsError } = await supabase
            .from("announcement_stats")
            .select("*")
            .in("announcement_id", announcements?.map((a) => a.id) || []);

          if (!statsError) {
            // Process stats if needed
          }
        }
      } catch (error) {
        console.error("Error fetching announcements:", error);
        setError("Failed to load announcements.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();

    // Set up realtime subscription
    const channel = supabase
      .channel("announcements_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "announcements",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setAnnouncements((prev) => [payload.new as Announcement, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setAnnouncements((prev) =>
              prev.map((ann) =>
                ann.id === (payload.new as Announcement).id
                  ? (payload.new as Announcement)
                  : ann
              )
            );
          } else if (payload.eventType === "DELETE") {
            setAnnouncements((prev) =>
              prev.filter(
                (ann) => ann.id !== (payload.old as { id: number }).id
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, isAdmin]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingAnnouncement) {
        // Update existing announcement in Supabase
        const { data, error } = await supabase
          .from("announcements")
          .update({
            title: formData.title,
            content: formData.content,
            priority: formData.priority,
          })
          .eq("id", editingAnnouncement.id)
          .select();

        if (error) throw error;
      } else {
        // Create new announcement in Supabase
        const { data, error } = await supabase
          .from("announcements")
          .insert([
            {
              title: formData.title,
              content: formData.content,
              priority: formData.priority,
              author: getAuthorName(user),
              user_id: user?.id || null, // Important for RLS
            },
          ])
          .select();
      }

      handleCloseModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      try {
        const { error } = await supabase
          .from("announcements")
          .delete()
          .eq("id", id);

        if (error) throw error;
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAnnouncement(null);
    setFormData({
      title: "",
      content: "",
      priority: "medium",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-700";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-700";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-4 w-4" />;
      case "medium":
        return <Bell className="h-4 w-4" />;
      case "low":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        role="alert"
      >
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Announcements
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {isAdmin
                  ? "Manage and publish announcements"
                  : "Stay updated with the latest news"}
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </button>
          )}
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No announcements available
          </div>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {announcement.title}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(
                        announcement.priority
                      )}`}
                    >
                      {getPriorityIcon(announcement.priority)}
                      <span className="ml-1 capitalize">
                        {announcement.priority}
                      </span>
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    {announcement.content}
                  </p>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </span>
                    <span>By {announcement.author}</span>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for Add/Edit Announcement */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {editingAnnouncement ? "Edit Announcement" : "New Announcement"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter announcement title"
                  />
                </div>

                <div>
                  <label
                    htmlFor="content"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Content
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    required
                    rows={4}
                    value={formData.content}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter announcement content"
                  />
                </div>

                <div>
                  <label
                    htmlFor="priority"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editingAnnouncement ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
