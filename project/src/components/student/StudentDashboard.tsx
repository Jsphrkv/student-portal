import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Calendar,
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";
import StatCard from "../shared/StatCard";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../shared/LoadingSpinner";
import { supabase } from "../../../lib/supabase";

interface Assignment {
  id: number;
  course: string;
  title: string;
  dueDate: string;
  priority: string;
}

interface Grade {
  id: string;
  semester: string;
  grade: number;
  subjects: Subjects;
}

interface Payment {
  id: string;
  amount: number;
  paid_date?: string;
  due_date?: string;
  status: string;
}

interface Users {
  id: string;
  first_name: string;
  last_name: string;
}

interface Subjects {
  id: string;
  name: string;
  code: string;
}

interface Enrollment {
  id: string;
  course_id: string;
  created_at: string;
  semester: string;
  status?: string;
  student_id: string;
  subject_id: string;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [gradesData, setGradesData] = useState<Grade[]>([]);
  const [paymentsData, setPaymentsData] = useState<Payment[]>([]);
  const [userData, setUserData] = useState<Users | null>(null);
  const [enrollmentData, setEnrollmentData] = useState<Enrollment[]>([]);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.id) return;

        const [
          { data: userData },
          { data: grades },
          { data: payments },
          { data: enrollment },
          { data: assignments },
        ] = await Promise.all([
          supabase.from("users").select("*").eq("id", user.id).single(),
          supabase
            .from("grades")
            .select(
              `id, semester , grade, 
              subjects:subjects_id(id, name, code)`
            )
            .eq("student_id", user.id),
          supabase.from("payments").select("*").eq("student_id", user.id),
          supabase.from("enrollments").select("*").eq("student_id", user.id),
          supabase.from("assignments").select("*").eq("student_id", user.id),
        ]);

        setEnrollmentData(enrollment || []);

        if (!grades) return;
        setGradesData(
          grades.map((g) => ({
            ...g,
            subjects: Array.isArray(g.subjects) ? g.subjects[0] : g.subjects,
          }))
        );

        setPaymentsData(payments || []);
        setUserData(userData || []);

        // Calculate stats
        const monthlyTuition =
          payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        setStats((prev) => ({
          ...prev,
          studentCount: 1,
          courseCount: enrollment?.length || 0,
          monthlyTuition,
          revenue: monthlyTuition,
          weeklyPaymentAmount: monthlyTuition / 4, // Example calculation
        }));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const calculateGPA = () => {
    if (gradesData.length === 0) return 0;
    const total = gradesData.reduce((sum, grade) => sum + grade.grade, 0);
    return ((total / gradesData.length / 100) * 4).toFixed(2);
  };

  const outstandingBalance = paymentsData
    .filter((payment) => !payment.paid_date)
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);

  const nextPaymentDue = paymentsData
    .filter((payment) => !payment.paid_date)
    .sort(
      (a, b) =>
        new Date(a.due_date || 0).getTime() -
        new Date(b.due_date || 0).getTime()
    )[0];

  const getLetterGrade = (numericGrade: number) => {
    if (numericGrade >= 97) return "A+";
    if (numericGrade >= 93) return "A";
    if (numericGrade >= 90) return "A-";
    if (numericGrade >= 87) return "B+";
    if (numericGrade >= 83) return "B";
    if (numericGrade >= 80) return "B-";
    if (numericGrade >= 77) return "C+";
    if (numericGrade >= 73) return "C";
    if (numericGrade >= 70) return "C-";
    if (numericGrade >= 67) return "D+";
    if (numericGrade >= 65) return "D";
    return "F";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {userData?.first_name + " " + userData?.last_name}!
        </h1>
        {Array.isArray(enrollmentData) &&
          enrollmentData.length > 0 &&
          enrollmentData[0]?.status && (
            <div className="mt-2 flex items-center space-x-4">
              <span className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
                {enrollmentData[0].status.charAt(0).toUpperCase() +
                  enrollmentData[0].status.slice(1)}
              </span>
            </div>
          )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Current GPA"
          value={calculateGPA()}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Enrolled Subjects"
          value={stats.courseCount.toString()}
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          title="Outstanding Balance"
          value={` ₱${outstandingBalance.toFixed(2)}`}
          icon={CreditCard}
          color={outstandingBalance > 0 ? "red" : "green"}
        />
        <StatCard
          title="Next Payment Due"
          value={
            nextPaymentDue?.due_date
              ? new Date(nextPaymentDue.due_date).toLocaleDateString()
              : "None"
          }
          icon={Calendar}
          color={nextPaymentDue ? "yellow" : "green"}
        />
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-12">
        {/* Recent Grades */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
              Recent Grades
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {gradesData.map((grade) => (
                <div
                  key={grade.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {grade.subjects.name} ({grade.subjects.code})
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {grade.semester}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {getLetterGrade(grade.grade)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {grade.grade}/100
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
