import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  GraduationCap,
  DollarSign,
  TrendingUp,
  BookOpen,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import LoadingSpinner from "../shared/LoadingSpinner";
import { useAuth } from "../../contexts/AuthContext";

interface AnalyticsData {
  enrollmentData: { semester: string; students: number }[];
  departmentData: { name: string; students: number; color: string }[];
  gradeDistribution: { grade: string; count: number; percentage: number }[];
  paymentData: { month: string; collected: number; pending: number }[];
  yearLevelData: { year: string; male: number; female: number }[];
  stats: {
    name: string;
    value: string;
    change: string;
    changeType: "increase" | "decrease" | "neutral";
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }[];
  recentActivities: {
    type: string;
    message: string;
    time: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const AnalyticsAdmin: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      try {
        // Fetch all data in parallel
        const [
          { data: enrollment },
          { data: grades },
          { data: payments },
          { data: students },
        ] = await Promise.all([
          supabase
            .from("enrollments")
            .select("*")
            .order("semester", { ascending: true }),
          supabase.from("grades").select("*"),
          supabase
            .from("payments")
            .select("*")
            .order("paid_date", { ascending: true }),
          supabase.from("student").select("id, year"),
        ]);

        // Calculate year level distribution from students data
        const yearLevelDistribution = students?.reduce((acc, student) => {
          const yearLevel = student.year || "Unknown";
          acc[yearLevel] = (acc[yearLevel] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Transform data to match our format
        const analyticsData: AnalyticsData = {
          enrollmentData:
            enrollment?.map((item) => ({
              semester: item.semester,
              students: item.student_count,
            })) || [],

          departmentData: [], // This would need to come from another table if needed

          gradeDistribution:
            grades?.map((grade) => ({
              grade: grade.grade_value, // assuming grade_value is the column name
              count: grade.student_count || 1, // default to 1 if not available
              percentage: grade.percentage || 0, // use actual percentage if available
            })) || [],

          paymentData:
            payments?.map((payment) => ({
              month: new Date(payment.payment_date).toLocaleString("default", {
                month: "short",
              }),
              collected: payment.amount,
              pending: payment.status === "pending" ? payment.amount : 0,
            })) || [],

          yearLevelData:
            Object.entries(yearLevelDistribution || {}).map(
              ([year, count]) => ({
                year,
                male: 0, // You would need gender data to populate this
                female: 0, // You would need gender data to populate this
                total: count,
              })
            ) || [],

          stats: [
            {
              name: "Total Students",
              value: students?.length.toString() || "0",
              change: "+0%", // You would need historical data to calculate this
              changeType: "neutral",
              icon: Users,
              color: "blue",
            },
            {
              name: "Average Grade",
              value: grades?.length
                ? (
                    grades.reduce(
                      (sum, grade) =>
                        sum + (parseFloat(grade.grade_value) || 0),
                      0
                    ) / grades.length
                  ).toFixed(2)
                : "0.00",
              change: "+0%",
              changeType: "neutral",
              icon: GraduationCap,
              color: "green",
            },
            {
              name: "Revenue (Monthly)",
              value: formatCurrency(
                payments
                  ?.filter((p) => p.status === "completed")
                  .reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0
              ),
              change: "-0%",
              changeType: "neutral",
              icon: DollarSign,
              color: "yellow",
            },
            {
              name: "Pending Payments",
              value:
                payments
                  ?.filter((p) => p.status === "pending")
                  .length.toString() || "0",
              change: "+0%",
              changeType: "neutral",
              icon: AlertCircle,
              color: "red",
            },
          ],

          recentActivities: [
            {
              type: "enrollment",
              message: `${
                enrollment?.[0]?.student_count || 0
              } new enrollments this semester`,
              time: "Today",
              icon: Users,
            },
            {
              type: "payment",
              message: `${formatCurrency(
                payments
                  ?.filter(
                    (p) =>
                      p.status === "completed" &&
                      new Date(p.payment_date).getMonth() ===
                        new Date().getMonth()
                  )
                  .reduce((sum, p) => sum + (p.amount || 0), 0)
              )} collected this month`,
              time: "Today",
              icon: DollarSign,
            },
            {
              type: "grades",
              message: `${grades?.length || 0} grades recorded`,
              time: "Today",
              icon: BookOpen,
            },
            {
              type: "alert",
              message: `${
                payments?.filter((p) => p.status === "pending").length || 0
              } pending payments`,
              time: "Today",
              icon: AlertTriangle,
            },
          ],
        };

        setData(analyticsData);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Unexpected error");
        }
        console.error("Error fetching analytics:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchAnalyticsData();
    }
  }, [user]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading analytics..." />;
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-lg">
        Error loading analytics: {error}
      </div>
    );
  }

  if (!data) {
    return <div>No data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive insights into student data and institutional
              performance
            </p>
          </div>
        </div>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center">
                <div
                  className={`flex-shrink-0 p-3 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}
                >
                  <Icon
                    className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`}
                  />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {stat.name}
                  </p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p
                      className={`ml-2 text-sm font-medium ${
                        stat.changeType === "increase"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {stat.change}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Enrollment Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.enrollmentData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E7EB"
                strokeOpacity={0.2}
              />
              <XAxis
                dataKey="semester"
                stroke="#6B7280"
                tick={{ fill: "#6B7280" }}
              />
              <YAxis stroke="#6B7280" tick={{ fill: "#6B7280" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  borderColor: "#374151",
                  borderRadius: "0.5rem",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="students"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: "#3B82F6", strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Department Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Students by Department
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.departmentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="students"
              >
                {data.departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  borderColor: "#374151",
                  borderRadius: "0.5rem",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Grade Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Grade Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.gradeDistribution}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E7EB"
                strokeOpacity={0.2}
              />
              <XAxis
                dataKey="grade"
                stroke="#6B7280"
                tick={{ fill: "#6B7280" }}
              />
              <YAxis stroke="#6B7280" tick={{ fill: "#6B7280" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  borderColor: "#374151",
                  borderRadius: "0.5rem",
                }}
              />
              <Legend />
              <Bar dataKey="count" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Analytics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Payment Collection
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.paymentData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E7EB"
                strokeOpacity={0.2}
              />
              <XAxis
                dataKey="month"
                stroke="#6B7280"
                tick={{ fill: "#6B7280" }}
              />
              <YAxis
                stroke="#6B7280"
                tick={{ fill: "#6B7280" }}
                tickFormatter={(value) => `₱${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                contentStyle={{
                  backgroundColor: "#1F2937",
                  borderColor: "#374151",
                  borderRadius: "0.5rem",
                }}
              />
              <Legend />
              <Bar
                dataKey="collected"
                stackId="a"
                fill="#10B981"
                name="Collected"
              />
              <Bar
                dataKey="pending"
                stackId="a"
                fill="#F59E0B"
                name="Pending"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gender Distribution by Year Level */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Gender Distribution by Year Level
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={data.yearLevelData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E5E7EB"
              strokeOpacity={0.2}
            />
            <XAxis dataKey="year" stroke="#6B7280" tick={{ fill: "#6B7280" }} />
            <YAxis stroke="#6B7280" tick={{ fill: "#6B7280" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                borderColor: "#374151",
                borderRadius: "0.5rem",
              }}
            />
            <Legend />
            <Bar dataKey="male" fill="#3B82F6" name="Male" />
            <Bar dataKey="female" fill="#EC4899" name="Female" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activities and Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        {/* <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Recent Activities
          </h3>
          <div className="space-y-4">
            {data.recentActivities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div
                    className={`flex-shrink-0 p-2 rounded-lg ${
                      activity.type === "enrollment"
                        ? "bg-blue-100 dark:bg-blue-900/20"
                        : activity.type === "payment"
                        ? "bg-green-100 dark:bg-green-900/20"
                        : activity.type === "grades"
                        ? "bg-purple-100 dark:bg-purple-900/20"
                        : "bg-red-100 dark:bg-red-900/20"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        activity.type === "enrollment"
                          ? "text-blue-600 dark:text-blue-400"
                          : activity.type === "payment"
                          ? "text-green-600 dark:text-green-400"
                          : activity.type === "grades"
                          ? "text-purple-600 dark:text-purple-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div> */}

        {/* Quick Stats */}
        {/* <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Quick Stats
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  Average GPA
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  3.42
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-200">
                  Retention Rate
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  96.8%
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div>
                <p className="text-sm font-medium text-purple-900 dark:text-purple-200">
                  Active Courses
                </p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  156
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div>
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                  Pending Issues
                </p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  12
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default AnalyticsAdmin;
