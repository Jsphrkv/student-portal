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
  Clock,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import LoadingSpinner from "../shared/LoadingSpinner";
import { useAuth } from "../../contexts/AuthContext";

interface AnalyticsData {
  enrollmentTrends: { period: string; count: number }[];
  departmentDistribution: { name: string; count: number; color: string }[];
  gradeDistribution: { grade: string; count: number }[];
  paymentAnalytics: { period: string; collected: number; pending: number }[];
  genderDistribution: { year: string; male: number; female: number }[];
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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const AnalyticsAdmin: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">(
    "month"
  );

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!user) return;

      setIsLoading(true);
      setError(null);

      try {
        // Get current date ranges
        const now = new Date();
        const startDate = new Date();

        if (timeRange === "week") {
          startDate.setDate(now.getDate() - 7);
        } else if (timeRange === "month") {
          startDate.setMonth(now.getMonth() - 1);
        } else {
          startDate.setFullYear(now.getFullYear() - 1);
        }

        // Fetch data from Supabase
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("*")
          .gte("created_at", startDate.toISOString())
          .order("created_at", { ascending: true });

        const { data: studentGroup } = await supabase
          .from("students_per_section")
          .select("*");

        const { data: grades } = await supabase
          .from("grades")
          .select("id, grade, created_at")
          .gte("created_at", startDate.toISOString());

        const { data: payments } = await supabase
          .from("payments")
          .select("id, amount, status, paid_date")
          .gte("due_date", startDate.toISOString())
          .order("paid_date", { ascending: true });

        const { data: students } = await supabase
          .from("student")
          .select("id, year, sex");

        // Process enrollment trends
        const enrollmentTrends = processTimeSeriesData(
          enrollments || [],
          timeRange,
          "created_at"
        );

        // Process department distribution
        const departmentDistribution = (studentGroup || []).map(
          (dept, index) => ({
            name: dept.name,
            count: dept.count || 0,
            color: COLORS[index % COLORS.length],
          })
        );

        // Process grade distribution
        const gradeDistribution = (grades || []).reduce((acc, grd) => {
          const grade = grd.grade || 0;
          const gradeRange = `${Math.floor(grade / 10) * 10}-${
            Math.floor(grade / 10) * 10 + 9
          }`;
          acc[gradeRange] = (acc[gradeRange] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Process payment analytics
        const paymentAnalytics = processTimeSeriesData(
          payments || [],
          timeRange,
          "paid_date",
          (payment) => ({
            collected: payment.status === "paid" ? payment.amount || 0 : 0,
            pending: payment.status === "pending" ? payment.amount || 0 : 0,
          })
        );

        // Process gender distribution
        const genderDistribution = (students || []).reduce((acc, student) => {
          const year = student.year || "Unknown";
          if (!acc[year]) {
            acc[year] = { male: 0, female: 0 };
          }
          if (student.sex === "male") acc[year].male++;
          if (student.sex === "female") acc[year].female++;
          return acc;
        }, {} as Record<string, { male: number; female: number }>);

        // Calculate statistics
        const totalStudents = students?.length || 0;
        const totalPayments =
          payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        const pendingPayments =
          payments?.filter((p) => p.status === "pending").length || 0;
        const avgGrade = grades?.length
          ? (
              grades.reduce((sum, g) => sum + (g.grade || 0), 0) / grades.length
            ).toFixed(1)
          : "0.0";

        // Prepare the final data structure
        const analyticsData: AnalyticsData = {
          enrollmentTrends,
          departmentDistribution,
          gradeDistribution: Object.entries(gradeDistribution)
            .map(([grade, count]) => ({ grade, count }))
            .sort((a, b) => parseInt(a.grade) - parseInt(b.grade)),
          paymentAnalytics,
          genderDistribution: Object.entries(genderDistribution)
            .map(([year, counts]) => ({ year, ...counts }))
            .sort((a, b) => a.year.localeCompare(b.year)),
          stats: [
            {
              name: "Total Students",
              value: totalStudents.toString(),
              change: "+0%", // You would calculate this based on historical data
              changeType: "neutral",
              icon: Users,
              color: "blue",
            },
            {
              name: "Avg. Grade",
              value: avgGrade,
              change: "+0%",
              changeType: "neutral",
              icon: GraduationCap,
              color: "green",
            },
            {
              name: "Total Revenue",
              value: formatCurrency(totalPayments),
              change: "+0%",
              changeType: "neutral",
              icon: DollarSign,
              color: "yellow",
            },
            {
              name: "Pending Payments",
              value: pendingPayments.toString(),
              change: "+0%",
              changeType: "neutral",
              icon: AlertCircle,
              color: "red",
            },
          ],
          recentActivities: [
            {
              type: "enrollment",
              message: `${enrollmentTrends.reduce(
                (sum, item) => sum + item.count,
                0
              )} total enrollments`,
              time: "Current period",
              icon: Users,
            },
            {
              type: "payment",
              message: `${formatCurrency(
                paymentAnalytics.reduce((sum, item) => sum + item.collected, 0)
              )} collected`,
              time: "Current period",
              icon: DollarSign,
            },
            {
              type: "grades",
              message: `${grades?.length || 0} grades recorded`,
              time: "Current period",
              icon: BookOpen,
            },
            {
              type: "alert",
              message: `${pendingPayments} pending payments`,
              time: "Current period",
              icon: AlertTriangle,
            },
          ],
        };

        setData(analyticsData);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError("Failed to load analytics data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [user, timeRange]);

  // Helper function to process time series data
  const processTimeSeriesData = (
    data: any[],
    range: "week" | "month" | "year",
    dateField: string,
    valueMapper?: (item: any) => Record<string, number>
  ) => {
    const result: Record<string, any> = {};

    data.forEach((item) => {
      const date = new Date(item[dateField]);
      let key: string;

      if (range === "year") {
        key = new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
      } else if (range === "month") {
        key = new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
        }).format(date);
      } else {
        key = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(
          date
        );
      }

      if (!result[key]) {
        result[key] = valueMapper ? valueMapper(item) : { count: 0 };
      } else {
        if (valueMapper) {
          Object.entries(valueMapper(item)).forEach(([k, v]) => {
            result[key][k] = (result[key][k] || 0) + v;
          });
        } else {
          result[key].count++;
        }
      }
    });

    return Object.entries(result).map(([period, values]) => ({
      period,
      ...values,
    }));
  };
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading analytics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No analytics data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive insights into institutional performance
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeRange("week")}
              className={`px-3 py-1 text-sm rounded-md ${
                timeRange === "week"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeRange("month")}
              className={`px-3 py-1 text-sm rounded-md ${
                timeRange === "month"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setTimeRange("year")}
              className={`px-3 py-1 text-sm rounded-md ${
                timeRange === "year"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Year
            </button>
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
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div
                  className={`flex-shrink-0 p-3 rounded-lg ${
                    stat.color === "blue"
                      ? "bg-blue-100 dark:bg-blue-900/20"
                      : stat.color === "green"
                      ? "bg-green-100 dark:bg-green-900/20"
                      : stat.color === "yellow"
                      ? "bg-yellow-100 dark:bg-yellow-900/20"
                      : "bg-red-100 dark:bg-red-900/20"
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 ${
                      stat.color === "blue"
                        ? "text-blue-600 dark:text-blue-400"
                        : stat.color === "green"
                        ? "text-green-600 dark:text-green-400"
                        : stat.color === "yellow"
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
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
                          : stat.changeType === "decrease"
                          ? "text-red-600 dark:text-red-400"
                          : "text-gray-500 dark:text-gray-400"
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Enrollment Trends
            </h3>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Clock className="h-4 w-4 mr-1" />
              {timeRange === "week"
                ? "Last 7 days"
                : timeRange === "month"
                ? "Last 30 days"
                : "Last 12 months"}
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.enrollmentTrends}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5E7EB"
                  strokeOpacity={0.2}
                />
                <XAxis
                  dataKey="period"
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
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Students by Section
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.departmentDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="name"
                >
                  {data.departmentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    value,
                    props.payload.name,
                  ]}
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    borderColor: "#374151",
                    borderRadius: "0.5rem",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Grade Distribution
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
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
                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Analytics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Payment Collection
            </h3>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Clock className="h-4 w-4 mr-1" />
              {timeRange === "week"
                ? "Last 7 days"
                : timeRange === "month"
                ? "Last 30 days"
                : "Last 12 months"}
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.paymentAnalytics}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5E7EB"
                  strokeOpacity={0.2}
                />
                <XAxis
                  dataKey="period"
                  stroke="#6B7280"
                  tick={{ fill: "#6B7280" }}
                />
                <YAxis
                  stroke="#6B7280"
                  tick={{ fill: "#6B7280" }}
                  tickFormatter={(value) => `₱${value / 1000}k`}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    borderColor: "#374151",
                    borderRadius: "0.5rem",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="collected"
                  name="Collected"
                  stackId="a"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="pending"
                  name="Pending"
                  stackId="a"
                  fill="#F59E0B"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Gender Distribution by Year Level */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Gender Distribution by Year Level
        </h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.genderDistribution}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E7EB"
                strokeOpacity={0.2}
              />
              <XAxis
                dataKey="year"
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
              <Bar
                dataKey="male"
                fill="#3B82F6"
                name="Male"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="female"
                fill="#EC4899"
                name="Female"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsAdmin;
