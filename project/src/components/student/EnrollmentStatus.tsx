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
import { v4 as uuidv4 } from "uuid";
import { LogAction } from "../../../utils/logger";

interface Subject {
  id: string;
  name: string;
  code: string;
  units: number;
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
  subject_id: string; // Single subject ID per enrollment record
  courses_id?: string; // Optional course reference
}
interface EnrollmentHistory {
  id: string;
  semester: string;
  status: "active" | "inactive" | "pending";
  subjects_count: number;
  units: number;
  created_at: string;
}
const EnrollmentStatus: React.FC = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]); // Multiple enrollments
  const [currentEnrollment, setCurrentEnrollment] = useState<Enrollment | null>(
    null
  ); // Current active enrollment
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showAllEnrolled, setShowAllEnrolled] = useState(false);
  const [showAllAvailable, setShowAllAvailable] = useState(false);
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
        // In your fetchData function
        // Fetch all enrollments
        const { data: enrollments, error: enrollmentError } = await supabase
          .from("enrollments")
          .select("*")
          .eq("student_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (enrollmentError) throw enrollmentError;

        // Set current enrollment (most recent active one)
        const activeEnrollment =
          enrollments?.find((e) => e.status === "active") || null;
        setCurrentEnrollment(activeEnrollment);
        setEnrollments(enrollments || []);

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
            subjects:subjects!enrollments_subject_id_fkey(count)
          `
          )
          .eq("student_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (historyError) throw historyError;

        // Transform history data to include subject count and units
        const transformedHistory = (history || []).map((item) => ({
          id: item.id,
          semester: item.semester,
          status: item.status,
          subjects_count: item.subjects?.[0]?.count || 0,
          units: 0, // Will be calculated below
          created_at: item.created_at,
        }));

        // Calculate units for each enrollment period
        if (enrollments && allSubjects) {
          const historyWithUnits = await Promise.all(
            transformedHistory.map(async (historyItem) => {
              // Fetch subjects for this enrollment period
              const { data: enrollmentSubjects } = await supabase
                .from("enrollments")
                .select("subject_id")
                .eq("id", historyItem.id);

              const subjectIds =
                enrollmentSubjects?.map((es) => es.subject_id) || [];
              const periodSubjects = allSubjects.filter((sub) =>
                subjectIds.includes(sub.id)
              );
              const totalUnits = periodSubjects.reduce(
                (sum, sub) => sum + sub.units,
                0
              );

              return {
                ...historyItem,
                units: totalUnits,
              };
            })
          );

          setEnrollmentHistory(historyWithUnits);
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
  // Get all subject IDs from current enrollment
  const enrolledSubjectIds = currentEnrollment
    ? enrollments
        .filter((e) => e.semester === currentEnrollment.semester)
        .map((e) => e.subject_id)
    : [];

  // Get full subject objects
  const enrolledSubjects = subjects.filter((subject) =>
    enrolledSubjectIds.includes(subject.id)
  );
  // Get available subjects (not enrolled in current enrollment)
  const enrolledIds = enrollments.map((e) => e.subject_id);
  const availableSubjects = subjects.filter(
    (subject) => !enrolledIds.includes(subject.id)
  );

  const totalUnits = enrolledSubjects.reduce(
    (sum, subject) => sum + subject.units,
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
  const handleEnroll = async (subjectId: string) => {
    if (!user?.id || !currentEnrollment) return;

    const newId = uuidv4();
    setIsLoading(true);

    try {
      const { data: newEnrollment, error } = await supabase
        .from("enrollments")
        .insert([
          {
            id: newId,
            student_id: user.id,
            subject_id: subjectId,
            semester: currentEnrollment.semester,
            courses_id: currentEnrollment.courses_id,
            status: "active",
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Update state
      setEnrollments((prev) => [newEnrollment, ...prev]);

      // Refresh subjects
      const { data: updatedSubjects } = await supabase
        .from("subjects")
        .select("*");
      setSubjects(updatedSubjects || []);

      const { data: history, error: historyError } = await supabase
        .from("enrollments")
        .select(
          `
            id,
            semester,
            status,
            created_at,
            subjects:subjects!enrollments_subject_id_fkey(count)
          `
        )
        .eq("student_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (historyError) throw historyError;

      // Transform history data to include subject count and units
      const transformedHistory = (history || []).map((item) => ({
        id: item.id,
        semester: item.semester,
        status: item.status,
        subjects_count: item.subjects?.[0]?.count || 0,
        units: 0, // Will be calculated below
        created_at: item.created_at,
      }));

      setEnrollmentHistory(transformedHistory);
      await LogAction({
        user_id: user?.id,
        action: "Enrolled in subject - " + subjectId,
        module: "Enrollment",
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Enrollment failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = async (subjectId: string) => {
    if (!user?.id || !currentEnrollment) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("enrollments")
        .update([
          {
            status: "drop",
          },
        ])
        .eq("student_id", user.id)
        .eq("subject_id", subjectId);

      if (error) throw error;

      const { data: enrollments, error: enrollmentError } = await supabase
        .from("enrollments")
        .select("*")
        .eq("student_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (enrollmentError) throw enrollmentError;

      setEnrollments(enrollments || []);

      const { data: history, error: historyError } = await supabase
        .from("enrollments")
        .select(
          `
            id,
            semester,
            status,
            created_at,
            subjects:subjects!enrollments_subject_id_fkey(count)
          `
        )
        .eq("student_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (historyError) throw historyError;

      // Transform history data to include subject count and units
      const transformedHistory = (history || []).map((item) => ({
        id: item.id,
        semester: item.semester,
        status: item.status,
        subjects_count: item.subjects?.[0]?.count || 0,
        units: 0, // Will be calculated below
        created_at: item.created_at,
      }));

      setEnrollmentHistory(transformedHistory);

      // Refresh subjects
      const { data: updatedSubjects } = await supabase
        .from("subjects")
        .select("*");
      setSubjects(updatedSubjects || []);

      await LogAction({
        user_id: user?.id,
        action: `Dropped subject - ${subjectId}`,
        module: "Enrollment",
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Enrollment failed");
    } finally {
      setIsLoading(false);
    }
  };

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
                Current Enrollment Status
              </p>
              {currentEnrollment ? (
                <div
                  className={`flex items-center space-x-1 mt-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    currentEnrollment.status
                  )}`}
                >
                  {getStatusIcon(currentEnrollment.status)}
                  <span>
                    {currentEnrollment.status.charAt(0).toUpperCase() +
                      currentEnrollment.status.slice(1)}
                  </span>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  No active enrollment
                </p>
              )}
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
                {currentEnrollment?.semester || "N/A"}
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
                Total Units
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {totalUnits}
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
                <>
                  {enrolledSubjects
                    .slice(0, showAllEnrolled ? enrolledSubjects.length : 3)
                    .map((subject) => (
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
                              {subject.code} • {subject.units} Units
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
                          <button
                            onClick={() => handleDrop(subject.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-500 text-sm font-medium"
                          >
                            Drop Subject
                          </button>
                        </div>
                      </div>
                    ))}
                  {enrolledSubjects.length > 3 && (
                    <button
                      onClick={() => setShowAllEnrolled(!showAllEnrolled)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-500 text-sm font-medium w-full text-center py-2"
                    >
                      {showAllEnrolled
                        ? "See Less"
                        : `See More (${enrolledSubjects.length - 3})`}
                    </button>
                  )}
                </>
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
                <>
                  {availableSubjects
                    .slice(0, showAllAvailable ? availableSubjects.length : 3)
                    .map((subject) => (
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
                              {subject.code} • {subject.units} Units
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
                          <button
                            onClick={() => handleEnroll(subject.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                          >
                            Enroll
                          </button>
                        </div>
                      </div>
                    ))}

                  {availableSubjects.length > 3 && (
                    <button
                      onClick={() => setShowAllAvailable(!showAllAvailable)}
                      className="w-full text-center text-blue-600 dark:text-blue-400 hover:text-blue-500 text-sm font-medium py-2"
                    >
                      {showAllAvailable
                        ? "Show Less"
                        : `See All (${availableSubjects.length})`}
                    </button>
                  )}
                </>
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
                  Units
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
                      {history.units}
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
