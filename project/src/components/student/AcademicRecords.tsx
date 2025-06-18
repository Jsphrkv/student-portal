import React, { useState, useEffect } from "react";
import { BookOpen, Download, Calendar, TrendingUp, Award } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../shared/LoadingSpinner";
import { supabase } from "../../../lib/supabase";

interface Grade {
  id: string;
  student_id: string;
  subject_id: string;
  subject_name: string;
  semester: string;
  grade: number;
  created_at: string;
}

interface Subject {
  id: string;
  name: string;
  created_at: string;
}

const AcademicRecords: React.FC = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState("All");

  useEffect(() => {
    const fetchAcademicData = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch grades for the current student
        const { data: gradesData, error: gradesError } = await supabase
          .from("grades")
          .select("*")
          .eq("student_id", user.id)
          .order("created_at", { ascending: false });

        if (gradesError) throw gradesError;

        // Fetch subjects (if needed for additional info)
        const { data: subjectsData, error: subjectsError } = await supabase
          .from("subjects")
          .select("id, name, created_at");

        if (subjectsError) throw subjectsError;

        setGrades(gradesData || []);
        setSubjects(subjectsData || []);
      } catch (error) {
        console.error("Error fetching academic records:", error);
        setError("Failed to load academic records. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAcademicData();
  }, [user]);

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

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return "text-green-600 dark:text-green-400";
    if (grade >= 80) return "text-blue-600 dark:text-blue-400";
    if (grade >= 70) return "text-yellow-600 dark:text-yellow-400";
    if (grade >= 65) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const calculateGPA = (semesterGrades: Grade[]) => {
    if (semesterGrades.length === 0) return "0.00";
    const total = semesterGrades.reduce((sum, grade) => sum + grade.grade, 0);
    return ((total / semesterGrades.length / 100) * 4).toFixed(2);
  };

  const semesters = [...new Set(grades.map((grade) => grade.semester))];
  const filteredGrades =
    selectedSemester === "All"
      ? grades
      : grades.filter((grade) => grade.semester === selectedSemester);

  const overallGPA = calculateGPA(grades);
  const semesterGPA =
    selectedSemester !== "All" ? calculateGPA(filteredGrades) : overallGPA;

  const determineAcademicStanding = (gpa: string) => {
    const numericGPA = parseFloat(gpa);
    if (numericGPA >= 3.5) return "Excellent";
    if (numericGPA >= 3.0) return "Good";
    if (numericGPA >= 2.0) return "Satisfactory";
    return "Probation";
  };

  const academicStanding = determineAcademicStanding(overallGPA);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner size="lg" text="Loading academic records..." />
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Academic Records
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View your grades, GPA, and academic performance
          </p>
        </div>
        <button
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          onClick={() => {
            // Implement transcript download functionality
            console.log("Download transcript");
          }}
        >
          <Download className="h-4 w-4" />
          <span>Download Transcript</span>
        </button>
      </div>

      {/* Academic Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Overall GPA
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {overallGPA}
              </p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Subjects
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {grades.length}
              </p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Semester GPA
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {semesterGPA}
              </p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Academic Standing
              </p>
              <p
                className={`text-2xl font-bold ${
                  academicStanding === "Excellent"
                    ? "text-green-600 dark:text-green-400"
                    : academicStanding === "Good"
                    ? "text-blue-600 dark:text-blue-400"
                    : academicStanding === "Satisfactory"
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-red-600 dark:text-red-400"
                } mt-1`}
              >
                {academicStanding}
              </p>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Semester Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Grade Records
          </h2>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="All">All Semesters</option>
            {semesters.map((semester) => (
              <option key={semester} value={semester}>
                {semester}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Subjectz
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Semester
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Numeric Grade
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Letter Grade
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredGrades.length > 0 ? (
                filteredGrades.map((grade) => (
                  <tr
                    key={grade.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {grade.subject_name}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                      {grade.semester}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`font-bold ${getGradeColor(grade.grade)}`}
                      >
                        {grade.grade}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`font-bold text-lg ${getGradeColor(
                          grade.grade
                        )}`}
                      >
                        {getLetterGrade(grade.grade)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-gray-600 dark:text-gray-400">
                      {new Date(grade.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {grades.length === 0
                        ? "No academic records found"
                        : "No grades found for the selected semester"}
                    </p>
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

export default AcademicRecords;
