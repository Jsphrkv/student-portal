import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  BookOpen,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../shared/LoadingSpinner";
import { supabase } from "../../../lib/supabase";

interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
  instructor: string;
  schedule: string;
  room: string;
}

interface Enrollment {
  id: string;
  student_id: string;
  semester: string;
  status: "active" | "inactive" | "pending";
  created_at: string;
  subjects?: string[]; // Array of subject IDs
}

interface EnrollmentHistory {
  id: string;
  semester: string;
  status: string;
  subjects_count: number;
  credits: number;
  created_at: string;
}

const EnrollmentStatus: React.FC = () => {
  const { user } = useAuth();
  const [enrollmentData, setEnrollmentData] = useState<Enrollment | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enrollmentHistory, setEnrollmentHistory] = useState<
    EnrollmentHistory[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch current enrollment
        const { data: enrollment, error: enrollmentError } = await supabase
          .from("enrollments")
          .select("*")
          .eq("student_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (enrollmentError) throw enrollmentError;

        setEnrollmentData(enrollment);

        // Fetch all subjects
        const { data: allSubjects, error: subjectsError } = await supabase
          .from("subjects")
          .select("*");

        if (subjectsError) throw subjectsError;

        setSubjects(allSubjects || []);

        // Fetch enrollment history
        const { data: history, error: historyError } = await supabase
          .from("enrollments")
          .select(
            `
            id,
            semester,
            status,
            created_at,
            subjects:enrollment_subjects(count)
          `
          )
          .eq("student_id", user.id)
          .order("created_at", { ascending: false });

        if (historyError) throw historyError;

        // Transform history data to include subject count and credits
        const transformedHistory = (history || []).map((item) => ({
          id: item.id,
          semester: item.semester,
          status: item.status,
          subjects_count: item.subjects?.[0]?.count || 0,
          credits: 0, // Will be calculated below
          created_at: item.created_at,
        }));

        // Calculate credits for each enrollment period
        if (enrollment && allSubjects) {
          const historyWithCredits = await Promise.all(
            transformedHistory.map(async (historyItem) => {
              // Fetch subjects for this enrollment period
              const { data: enrollmentSubjects } = await supabase
                .from("enrollment_subjects")
                .select("subject_id")
                .eq("enrollment_id", historyItem.id);

              const subjectIds =
                enrollmentSubjects?.map((es) => es.subject_id) || [];
              const periodSubjects = allSubjects.filter((sub) =>
                subjectIds.includes(sub.id)
              );
              const totalCredits = periodSubjects.reduce(
                (sum, sub) => sum + sub.credits,
                0
              );

              return {
                ...historyItem,
                credits: totalCredits,
              };
            })
          );

          setEnrollmentHistory(historyWithCredits);
        } else {
          setEnrollmentHistory(transformedHistory);
        }
      } catch (error) {
        console.error("Error fetching enrollment data:", error);
        setError("Failed to load enrollment.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
      case "inactive":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
      case "pending":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />;
      case "inactive":
        return <AlertCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Get enrolled subjects for current enrollment
  const enrolledSubjects = enrollmentData?.subjects
    ? subjects.filter((subject) =>
        enrollmentData.subjects?.includes(subject.id)
      )
    : [];

  // Get available subjects (not enrolled in current enrollment)
  const availableSubjects = enrollmentData?.subjects
    ? subjects.filter(
        (subject) => !enrollmentData.subjects?.includes(subject.id)
      )
    : subjects;

  const totalCredits = enrolledSubjects.reduce(
    (sum, subject) => sum + subject.credits,
    0
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner size="lg" text="Loading enrollment information..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-red-600 dark:text-red-400 text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Enrollment Status
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View your current enrollment and manage course registration
        </p>
      </div>

      {/* Enrollment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Enrollment Status
              </p>
              <div
                className={`flex items-center space-x-1 mt-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  enrollmentData?.status || "inactive"
                )}`}
              >
                {getStatusIcon(enrollmentData?.status || "inactive")}
                <span>
                  {enrollmentData
                    ? enrollmentData?.status?.charAt(0).toUpperCase() +
                        enrollmentData?.status?.slice(1) || "Inactive"
                    : ""}
                </span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Semester Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Current Semester
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                {enrollmentData?.semester || "N/A"}
              </p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Subjects Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Enrolled Subjects
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {enrolledSubjects.length}
              </p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* Credits Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Credits
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {totalCredits}
              </p>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrolled Subjects */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
              Enrolled Subjects ({enrolledSubjects.length})
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {enrolledSubjects.length > 0 ? (
                enrolledSubjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {subject.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {subject.code} • {subject.credits} Credits
                        </p>
                      </div>
                      <span className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium">
                        Enrolled
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>
                        <strong>Instructor:</strong> {subject.instructor}
                      </p>
                      <p>
                        <strong>Schedule:</strong> {subject.schedule}
                      </p>
                      <p>
                        <strong>Room:</strong> {subject.room}
                      </p>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <button className="text-red-600 dark:text-red-400 hover:text-red-500 text-sm font-medium">
                        Drop Subject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No enrolled subjects found
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Available Subjects */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
              Available Subjects ({availableSubjects.length})
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {availableSubjects.length > 0 ? (
                availableSubjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {subject.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {subject.code} • {subject.credits} Credits
                        </p>
                      </div>
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full text-xs font-medium">
                        Available
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>
                        <strong>Instructor:</strong> {subject.instructor}
                      </p>
                      <p>
                        <strong>Schedule:</strong> {subject.schedule}
                      </p>
                      <p>
                        <strong>Room:</strong> {subject.room}
                      </p>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors">
                        Enroll
                      </button>
                      <button className="text-blue-600 dark:text-blue-400 hover:text-blue-500 text-sm font-medium">
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No available subjects found
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
          Enrollment History
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Semester
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Status
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Subjects
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Credits
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Date Enrolled
                </th>
              </tr>
            </thead>
            <tbody>
              {enrollmentHistory.length > 0 ? (
                enrollmentHistory.map((history) => (
                  <tr
                    key={history.id}
                    className="border-b border-gray-100 dark:border-gray-700"
                  >
                    <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">
                      {history.semester}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          history.status
                        )}`}
                      >
                        {history.status.charAt(0).toUpperCase() +
                          history.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-gray-900 dark:text-white">
                      {history.subjects_count}
                    </td>
                    <td className="py-4 px-4 text-center text-gray-900 dark:text-white">
                      {history.credits}
                    </td>
                    <td className="py-4 px-4 text-center text-gray-600 dark:text-gray-400">
                      {new Date(history.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    No enrollment history found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentStatus;
