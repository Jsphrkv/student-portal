import React, { useState, useEffect } from "react";
import { Users, ChevronDown, ChevronUp } from "lucide-react";
// import StatCard from "../shared/StatCard";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../shared/LoadingSpinner";
import { supabase } from "../../../lib/supabase";
import { v4 as uuidv4 } from "uuid";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  year_level: number;
  section: string;
}

interface Grade {
  id: string;
  subject_name: string;
  semester: string;
  grade: number;
  student_id: string;
}

interface Subjects {
  id: string;
  name: string;
  code: string;
  instructor: string;
  student_id: string;
  subject_id: string;
  course_id: string;
  semester: string;
  grade?: number; // Optional, if grades are included in subjects
}
interface Payment {
  id: string;
  amount: number;
  payment_date?: string;
  due_date?: string;
  status: string;
  student_id: string;
}

interface CurSub {
  student_id: string;
  subject_id: string;
  course_id?: string;
  semester?: string;
  name?: string;
}

const Students: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [gradesData, setGradesData] = useState<Grade[]>([]);
  const [paymentsData, setPaymentsData] = useState<Payment[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [showYearSelection, setShowYearSelection] = useState(true);
  const [showSectionSelection, setShowSectionSelection] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [subjectsData, setSubjectsData] = useState<Subjects[]>([]); // Adjust type as needed

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSubject, setCurrentSubject] = useState<CurSub | null>(null);

  const sections = ["A-AM", "A-PM", "B", "C"]; // Example sections

  useEffect(() => {
    if (selectedYear && selectedSection) {
      fetchStudents();
    }
  }, [selectedYear, selectedSection]);
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      // 1. First fetch students from student table
      const { data: studentsData, error: studentsError } = await supabase
        .from("student")
        .select("*")
        .eq("section", selectedSection)
        .eq("year", selectedYear);

      if (studentsError) throw studentsError;
      if (!studentsData || studentsData.length === 0) {
        setStudents([]);
        return;
      }

      // 2. Get user IDs to fetch user details
      const userIds = studentsData.map((s) => s.user_id).filter(Boolean);
      if (userIds.length === 0) {
        setStudents([]);
        return;
      }
      console.log(userIds);

      // 3. Fetch user details in a separate query
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, first_name, last_name, email")
        .in("id", userIds);

      if (usersError) throw usersError;

      // 4. Combine the data
      const formattedStudents = studentsData.map((student) => {
        const user = usersData?.find((u) => u.id === student.user_id);
        return {
          id: student.id,
          user_id: student.user_id,
          first_name: user?.first_name || "",
          last_name: user?.last_name || "",
          email: user?.email || "",
          year_level: student.year,
          section: student.section,
          // Include other student fields you need
        };
      });

      setStudents(formattedStudents);

      // 5. Fetch related data
      const studentIds = formattedStudents.map((s) => s.id);
      const [
        { data: grades },
        { data: payments },
        { data: subjectsEnrolled },
        { data: gradeEnrolledSub },
      ] = await Promise.all([
        supabase
          .from("grades")
          .select("* , subjects:subjects_id(*)")
          .in("student_id", studentIds),
        supabase.from("payments").select("*").in("student_id", studentIds),
        await supabase
          .from("enrollments")
          .select(
            `
    *,
    subjects:subject_id (id, name, code, instructor)
  `
          )
          .in("student_id", studentIds),
        await supabase.from("grades").select("*").in("student_id", studentIds),
      ]);

      const mergedData = subjectsEnrolled?.map((subjectsEnrolled) => ({
        ...subjectsEnrolled,
        grade:
          gradeEnrolledSub?.find(
            (g) =>
              g.subject_id === subjectsEnrolled.subject_id &&
              g.student_id === subjectsEnrolled.student_id
          )?.grade || null,
      }));

      const gradesDataMap = grades?.map((grd) => ({
        id: grd.id,
        grade: grd.grade,
        subject_name: grd.subjects.name,
        semester: grd.semester,
        student_id: grd.student_id,
      }));

      const subEnrolledData =
        mergedData?.map((enrollment) => ({
          id: enrollment.id,
          student_id: enrollment.student_id,
          name: enrollment.subjects.name,
          code: enrollment.subjects.code,
          instructor: enrollment.subjects.instructor,
          subject_id: enrollment.subjects.id,
          course_id: enrollment.courses_id,
          semester: enrollment.semester,
          grade: enrollment.grades?.grade || null, // Assuming grades is optional
        })) || [];

      setGradesData(gradesDataMap || []);
      setPaymentsData(payments || []);
      setSubjectsData(subEnrolledData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      // Handle error appropriately
    } finally {
      setIsLoading(false);
    }
  };

  const calculateGPA = (studentId: string) => {
    const studentGrades = gradesData.filter((g) => g.student_id === studentId);
    if (studentGrades.length === 0) return 0;
    const total = studentGrades.reduce((sum, grade) => sum + grade.grade, 0);
    return ((total / studentGrades.length / 100) * 4).toFixed(2);
  };

  const getOutstandingBalance = (studentId: string) => {
    return paymentsData
      .filter((p) => p.student_id === studentId && !p.payment_date)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  };

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

  const toggleStudentExpansion = (studentId: string) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  const handleYearSelect = (year: string) => {
    setSelectedYear(year);
    setShowYearSelection(false);
    setShowSectionSelection(true);
    setSelectedSection(null);
  };

  const handleSectionSelect = (section: string) => {
    setSelectedSection(section);
    setShowSectionSelection(false);
  };

  const resetSelections = () => {
    setSelectedYear(null);
    setSelectedSection(null);
    setShowYearSelection(true);
    setShowSectionSelection(false);
    setStudents([]);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner size="lg" text="Loading student data..." />
      </div>
    );
  }

  // Handle opening modal
  const handleAddGradeClick = (subjectId: string, studentId: string) => {
    const subject = subjectsData.find((s) => s.subject_id === subjectId);
    setCurrentSubject({
      subject_id: subjectId,
      student_id: studentId,
      name: subject?.name,
      course_id: subject?.course_id,
      semester: subject?.semester,
    });
    setIsModalOpen(true);
  };

  const handleGradeSubmit = async (grade: string) => {
    if (!grade || !currentSubject) return;
    const newId = uuidv4();
    try {
      await supabase.from("grades").insert({
        id: newId,
        grade: grade,
        student_id: currentSubject.student_id,
        subjects_id: currentSubject.subject_id,
        course_id: currentSubject.course_id,
        semester: currentSubject.semester,
        created_at: new Date().toISOString(),
      });

      // Refresh the data
      await fetchStudents();
    } catch (error) {
      console.error("Error submitting grade:", error);
    } finally {
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Students List
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View student data by year and section
        </p>
      </div>

      {/* Selection Process */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {showYearSelection && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Year Level
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {["1st Year", "2nd Year", "3rd Year"].map((year) => (
                <button
                  key={year}
                  onClick={() => handleYearSelect(year)}
                  className="px-4 py-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg font-medium transition-colors"
                >
                  Year {year}
                </button>
              ))}
            </div>
          </div>
        )}

        {showSectionSelection && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setShowSectionSelection(false);
                  setShowYearSelection(true);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ← Back
              </button>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Year {selectedYear} - Select Section
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {sections.map((section) => (
                <button
                  key={section}
                  onClick={() => handleSectionSelect(section)}
                  className="px-4 py-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg font-medium transition-colors"
                >
                  Section {section}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedYear && selectedSection && (
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Year {selectedYear} - Section {selectedSection}
              </h2>
              <button
                onClick={resetSelections}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Change selection
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {students.length} students found
            </p>
          </div>
        )}
      </div>

      {/* Student List */}
      {selectedYear && selectedSection && students.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Student
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    GPA
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Balance
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {students.map((student) => (
                  <React.Fragment key={student.id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {student.first_name} {student.last_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {calculateGPA(student.id)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          ${getOutstandingBalance(student.id).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => toggleStudentExpansion(student.id)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 flex items-center"
                        >
                          {expandedStudent === student.id ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Hide details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              View details
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedStudent === student.id && (
                      <tr className="bg-gray-50 dark:bg-gray-700/30">
                        <td colSpan={4} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Grades Section */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                                  Grades
                                </h3>
                              </div>
                              <div className="p-4">
                                {gradesData.filter(
                                  (g) => g.student_id === student.id
                                ).length > 0 ? (
                                  <div className="space-y-3">
                                    {gradesData
                                      .filter(
                                        (g) => g.student_id === student.id
                                      )
                                      .map((grade) => (
                                        <div
                                          key={grade.id}
                                          className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded"
                                        >
                                          <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                              {grade.subject_name}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                              {grade.semester}
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <p
                                              className={`font-bold ${
                                                grade.grade >= 70
                                                  ? "text-green-600 dark:text-green-400"
                                                  : "text-red-600 dark:text-red-400"
                                              }`}
                                            >
                                              {getLetterGrade(grade.grade)}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                              {grade.grade}/100
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    No grades recorded
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Payments Section */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                                  Payment History
                                </h3>
                              </div>
                              <div className="p-4">
                                {paymentsData.filter(
                                  (p) => p.student_id === student.id
                                ).length > 0 ? (
                                  <div className="space-y-3">
                                    {paymentsData
                                      .filter(
                                        (p) => p.student_id === student.id
                                      )
                                      .map((payment) => (
                                        <div
                                          key={payment.id}
                                          className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded"
                                        >
                                          <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                              ${payment.amount.toFixed(2)}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                              {payment.due_date
                                                ? new Date(
                                                    payment.due_date
                                                  ).toLocaleDateString()
                                                : "No due date"}
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <p
                                              className={`font-medium ${
                                                payment.payment_date
                                                  ? "text-green-600 dark:text-green-400"
                                                  : "text-red-600 dark:text-red-400"
                                              }`}
                                            >
                                              {payment.payment_date
                                                ? "Paid"
                                                : "Pending"}
                                            </p>
                                            {payment.payment_date && (
                                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(
                                                  payment.payment_date
                                                ).toLocaleDateString()}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    No payment records
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Enrolled Subject Section */}
                          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                              <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                                Enrolled Subjects
                              </h3>
                            </div>

                            <div className="p-4">
                              {subjectsData.filter(
                                (s) => s.student_id === student.id
                              ).length > 0 ? (
                                <div className="space-y-4">
                                  {subjectsData
                                    .filter((s) => s.student_id === student.id)
                                    .map((subject) => (
                                      <div
                                        key={subject.id}
                                        className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-gray-900 dark:text-white truncate">
                                            {subject.name} ({subject.code})
                                          </p>
                                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            Instructor: {subject.instructor}
                                          </p>
                                          {subject.grade && (
                                            <p className="text-sm mt-1">
                                              Grade:{" "}
                                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                                {subject.grade}
                                              </span>
                                            </p>
                                          )}
                                        </div>

                                        <div className="flex space-x-2 ml-4">
                                          <button
                                            onClick={() =>
                                              handleAddGradeClick(
                                                subject.subject_id,
                                                student.id
                                              )
                                            }
                                            className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                                          >
                                            {subject.grade
                                              ? "Edit Grade"
                                              : "Add Grade"}
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              ) : (
                                <div className="text-center py-6">
                                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    No enrolled subjects found
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Grade Input Modal */}
                            <GradeInputModal
                              isOpen={isModalOpen}
                              onClose={() => setIsModalOpen(false)}
                              onSubmit={handleGradeSubmit}
                              subjectName={currentSubject?.name || ""}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedYear && selectedSection && students.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            No students found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            There are no students in Year {selectedYear} Section{" "}
            {selectedSection}.
          </p>
          <div className="mt-6">
            <button
              onClick={resetSelections}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Select different year/section
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
interface GradeInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (grade: string) => void;
  subjectName: string;
}
const GradeInputModal = ({
  isOpen,
  onClose,
  onSubmit,
  subjectName,
}: GradeInputModalProps) => {
  const [grade, setGrade] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded bg-white dark:bg-gray-800 p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Add Grade for {subjectName}
        </h2>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Grade
          </label>
          <input
            type="number"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            placeholder="Enter grade (0-100)"
          />
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSubmit(grade);
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            Submit Grade
          </button>
        </div>
      </div>
    </div>
  );
};
