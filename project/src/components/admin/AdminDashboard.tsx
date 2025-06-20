import React, { useState, useEffect } from "react";
import {
  Users,
  GraduationCap,
  DollarSign,
  TrendingUp,
  UserCheck,
  AlertTriangle,
  BarChartBig,
  CreditCard,
  Calendar,
  FileText,
} from "lucide-react";
import { supabase } from "../../../lib/supabase"; // Make sure this is properly initialized
import StatCard from "../shared/StatCard";
import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import {
  BarChart,
  LabelList,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ActivityType {
  id: string;
  action: string;
  user: string;
  time: string;
  type: string;
}

interface TaskType {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
}

interface Student {
  id: string;
  courses_id: string;
}

interface Course {
  id: string;
  name: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    studentCount: 0,
    courseCount: 0,
    studentTrend: 0,
    courseTrend: 0,
    revenueTrend: 0,
    issuesTrend: 0,
    monthlyTuition: 0,
    weeklyPaymentsCount: 0,
    weeklyPaymentAmount: 0,
  });

  const [pendingTasks, setPendingTasks] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  firstDayOfMonth.setHours(0, 0, 0, 0);

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#8dd1e1"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel
        const [
          studentsData,
          coursesData,
          weeklyPaymentsData,
          monthlyPaymentsData,
          tasksData,
        ]: [
          PostgrestSingleResponse<any>,
          PostgrestSingleResponse<any>,
          PostgrestSingleResponse<any>,
          PostgrestSingleResponse<any>,
          PostgrestSingleResponse<any>
        ] = await Promise.all([
          // Student stats
          supabase.from("student").select("*", { count: "exact" }),

          // Course stats
          supabase.from("courses").select("*", { count: "exact" }),

          supabase
            .from("payments")
            .select("amount")
            .gte("paid_date", firstDayOfMonth.toISOString())
            .eq("status", "paid"),

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
            .from("support_requests")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        console.log(coursesData);

        // Set students and courses for later use
        setStudents(studentsData.data || []);
        setCourses(coursesData.data || []);

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

        // Transform tasks data
        const transformedTasks =
          tasksData.data?.map((task: any, index: any) => ({
            id: task.id || index,
            name: task.name || `Task ${index + 1}`,
            email: task.email || "",
            subject: task.subject || "",
            message: task.message || "",
            status: task.status || "pending",
          })) || [];

        // Update state
        setStats({
          studentCount: studentsData.count || 0,
          courseCount: coursesData.count || 0,
          monthlyTuition, // Use this for "Tuition Collected"
          weeklyPaymentsCount, // Use this for "Recent Payments"
          studentTrend,
          courseTrend: 5, // Example static value
          revenueTrend: 8.5, // Example static value
          issuesTrend: -15, // Example static value
          weeklyPaymentAmount,
        });

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
  console.log(courses);

  const data = courses.map((course) => {
    const count = students.filter((s) => s.courses_id === course.id).length;
    return { name: course.name, value: count };
  });

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
          value={`${stats.weeklyPaymentsCount} (₱${stats.weeklyPaymentAmount})`}
          icon={DollarSign}
          color="green"
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Tuition Collected (Month)"
          value={`₱${stats.monthlyTuition}`}
          icon={CreditCard}
          color="blue"
          trend={{ value: 6.5, isPositive: true }}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <BarChartBig className="h-5 w-5 mr-2 text-blue-700 dark:text-blue-400" />
            Student Distribution by Course
          </h2>
        </div>
        <div className="p-6 h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9CA3AF" }}
                ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30]}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={150}
                tick={{ fill: "#9CA3AF" }}
              />
              <Tooltip cursor={{ fill: "#f3f4f6" }} />
              <Bar
                dataKey="value"
                fill="#3b82f6"
                barSize={24}
                radius={[4, 4, 4, 4]}
              >
                <LabelList dataKey="value" position="right" fill="#3b82f6" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pending Tasks */}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" />
            Recent Issues
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {pendingTasks.length > 0 ? (
              pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex-1 space-y-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {task.subject || "No Subject"}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {task.message || "No Message"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      From: {task.name} ({task.email})
                    </p>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                        task.status === "pending"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200"
                          : task.status === "resolved"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {task.status || "Unknown"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                No pending issues found.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
