import React, { useState, useEffect } from "react";
import {
  Users,
  GraduationCap,
  DollarSign,
  TrendingUp,
  UserCheck,
  AlertTriangle,
  CreditCard,
  Calendar,
  FileText,
} from "lucide-react";
import { supabase } from "../../../lib/supabase"; // Make sure this is properly initialized
import StatCard from "../shared/StatCard";
import type { PostgrestSingleResponse } from "@supabase/supabase-js";

interface ActivityType {
  id: string;
  action: string;
  user: string;
  time: string;
  type: string;
}

interface TaskType {
  id: string;
  task: string;
  count: number;
  priority: "low" | "medium" | "high";
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    studentCount: 0,
    courseCount: 0,
    revenue: 0,
    pendingIssues: 0,
    studentTrend: 0,
    courseTrend: 0,
    revenueTrend: 0,
    issuesTrend: 0,
    monthlyTuition: 0,
    weeklyPaymentsCount: 0,
    weeklyPaymentAmount: 0,
  });

  const [recentActivities, setRecentActivities] = useState<ActivityType[]>([]);
  const [pendingTasks, setPendingTasks] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);

  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  firstDayOfMonth.setHours(0, 0, 0, 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel
        const [
          studentsData,
          coursesData,
          weeklyPaymentsData,
          monthlyPaymentsData,
          activitiesData,
          tasksData,
          issuesData,
        ]: [
          PostgrestSingleResponse<any>,
          PostgrestSingleResponse<any>,
          PostgrestSingleResponse<any>,
          PostgrestSingleResponse<any>,
          PostgrestSingleResponse<any>,
          PostgrestSingleResponse<any>,
          PostgrestSingleResponse<any>
        ] = await Promise.all([
          // Student stats
          supabase.from("student").select("*", { count: "exact", head: true }),

          // Course stats
          supabase.from("courses").select("*", { count: "exact", head: true }),

          supabase
            .from("payments")
            .select("amount")
            .gte("payment_date", firstDayOfMonth.toISOString())
            .eq("status", "completed"),

          // Recent payments (last 7 days)
          supabase
            .from("payments")
            .select("amount, created_at")
            .gte(
              "created_at",
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            )
            .order("created_at", { ascending: false }),

          // Recent activities (from audit_logs)
          supabase
            .from("audit_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5),

          // Add in your Promise.all list:
          supabase.from("issues").select("*", { count: "exact", head: true }),

          // Pending tasks (example: unprocessed payments)
          supabase.from("payments").select("*").is("processed", false).limit(4),
        ]);

        // Calculate trends (simplified example)
        const lastMonthStudentCount = 100; // You would fetch this from DB
        const studentTrend = studentsData.count
          ? Math.round(
              ((studentsData.count - lastMonthStudentCount) /
                lastMonthStudentCount) *
                100
            )
          : 0;

        // Calculate metrics
        const monthlyTuition =
          monthlyPaymentsData.data?.reduce(
            (sum: any, p: any) => sum + (p.amount || 0),
            0
          ) || 0;
        const weeklyPaymentsCount = weeklyPaymentsData.data?.length || 0;
        const weeklyPaymentAmount =
          weeklyPaymentsData.data?.reduce(
            (sum: any, p: any) => sum + (p.amount || 0),
            0
          ) || 0;

        // Transform activities data to match your UI structure
        const transformedActivities =
          activitiesData.data?.map((log: any) => ({
            id: log.id,
            action: log.action_type || "System action",
            user: log.user_id,
            time: formatTimeAgo(log.created_at),
            type: log.table_affected || "system",
          })) || [];

        // Transform tasks data
        const transformedTasks =
          tasksData.data?.map((task: any, index: any) => ({
            id: task.id || index,
            task: `Process payment ${task.id?.slice(0, 6) || ""}`,
            count: 1, // Each task represents one item
            priority:
              index % 3 === 0 ? "high" : index % 2 === 0 ? "medium" : "low",
          })) || [];

        // Update state
        setStats({
          studentCount: studentsData.count || 0,
          courseCount: coursesData.count || 0,
          monthlyTuition, // Use this for "Tuition Collected"
          weeklyPaymentsCount, // Use this for "Recent Payments"
          revenue:
            monthlyPaymentsData.data?.reduce(
              (sum: any, p: any) => sum + (p.amount || 0),
              0
            ) || 0,
          pendingIssues: issuesData.count || 0,
          studentTrend,
          courseTrend: 5, // Example static value
          revenueTrend: 8.5, // Example static value
          issuesTrend: -15, // Example static value
          weeklyPaymentAmount,
        });

        setRecentActivities(transformedActivities);
        setPendingTasks(transformedTasks);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper function to format time as "X hours ago"
  const formatTimeAgo = (dateString: any) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.round(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );
    return `${diffHours} hours ago`;
  };

  // Keep all your existing UI helper functions
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "registration":
        return (
          <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
        );
      case "payment":
        return (
          <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        );
      case "academic":
        return (
          <GraduationCap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        );
      case "enrollment":
        return (
          <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        );
      default:
        return (
          <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        );
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
      case "medium":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20";
      case "low":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  // Loading state (optional)
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Keep all your existing JSX exactly as is, just replace the hardcoded values */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          System overview and management tools
        </p>
      </div>

      {/* Stats Grid - Now with real data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats.studentCount.toLocaleString()}
          icon={Users}
          color="blue"
          trend={{
            value: stats.studentTrend,
            isPositive: stats.studentTrend >= 0,
          }}
        />
        <StatCard
          title="Active Courses"
          value={stats.courseCount.toString()}
          icon={GraduationCap}
          color="green"
          trend={{
            value: stats.courseTrend,
            isPositive: stats.courseTrend >= 0,
          }}
        />
        <StatCard
          title="Recent Payments (Week)"
          value={`${stats.weeklyPaymentsCount} ($${stats.weeklyPaymentAmount})`}
          icon={DollarSign}
          color="green"
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Tuition Collected (Month)"
          value={`$${stats.monthlyTuition}`}
          icon={CreditCard}
          color="blue"
          trend={{ value: 6.5, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
              Recent Activities
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {activity.user}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" />
              Pending Tasks
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {task.task}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {task.count} items pending
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                      task.priority
                    )}`}
                  >
                    {task.priority.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors group">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Manage Students
            </p>
          </button>
          <button className="p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors group">
            <GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400 mb-2" />
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              Course Management
            </p>
          </button>
          <button className="p-4 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg transition-colors group">
            <DollarSign className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mb-2" />
            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
              Financial Reports
            </p>
          </button>
          <button className="p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors group">
            <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400 mb-2" />
            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
              Generate Reports
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
