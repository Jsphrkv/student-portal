import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Plus,
  Edit3,
  Trash2,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import LoadingSpinner from "../shared/LoadingSpinner";
import { v4 as uuidv4 } from "uuid";
import { LogAction } from "../../../utils/logger";

interface Payment {
  id: number;
  description: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: "paid" | "pending" | "overdue";
  semester: string;
  type: string;
  year_level: "";
  section: "";
  student_id?: string;
  school_year?: string;
}

const generateSchoolYears = (
  count: number = 6
): { id: string; name: string }[] => {
  const startYear = new Date().getFullYear() - 1;
  const years: { id: string; name: string }[] = [];

  for (let i = 0; i < count; i++) {
    const from = startYear + i;
    const to = from + 1;
    const label = `${from}-${to}`;
    years.push({ id: label, name: label });
  }

  return years;
};

const FinancialAdmin: React.FC = () => {
  const schoolYear = generateSchoolYears(5);

  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    due_date: "",
    semester: "",
    type: "",
    year: "",
    section: "",
    school_year: "",
  });
  const [showYearSelection, setShowYearSelection] = useState(false);
  const [showSectionSelection, setShowSectionSelection] = useState(false);

  const years = ["1st Year", "2nd Year", "3rd Year"];
  const sections = ["A-AM", "A-PM", "B", "C"];

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from("payments").select("*");

      if (!isAdmin) {
        query = query.eq("student_id", user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate summary statistics
  const totalAmount = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  const paidAmount = payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = payments
    .filter((payment) => payment.status === "pending")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const overdueAmount = payments
    .filter((payment) => payment.status === "overdue")
    .reduce((sum, payment) => sum + payment.amount, 0);

  const handleInputChange = (field: string, value: string | number) => {
    // Example usage

    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.description ||
      !formData.amount ||
      !formData.due_date ||
      !formData.semester ||
      !formData.school_year ||
      !formData.type
    ) {
      alert("Please fill in all required fields.");
      return;
    }
    try {
      if (editingPayment) {
        const { error } = await supabase
          .from("payments")
          .update({
            description: formData.description,
            amount: parseFloat(formData.amount),
            due_date: formData.due_date,
            semester: formData.semester + " " + formData.school_year,
            section: formData.section ? formData.section : "All Sections",
            billing_type: formData.type,
          })
          .eq("id", editingPayment.id);

        if (error) throw error;

        await LogAction({
          user_id: user?.id,
          action: "Updated payment",
          module: "Financial Admin",
        });
      } else {
        // Fetch students by year level and section
        let query = supabase.from("student").select("id");

        if (
          formData.year !== "" ||
          formData.year !== null ||
          formData.year !== undefined ||
          formData.year != "All Years"
        ) {
          query = query.eq("year", formData.year);
        }

        if (
          formData.section !== "" ||
          formData.section !== null ||
          formData.section !== undefined ||
          formData.section != "All Sections"
        ) {
          query = query.eq("section", formData.section);
        }

        const { data: students, error: studentError } = await query;

        if (studentError) throw studentError;
        if (!students || students.length === 0) {
          window.alert("No students found for the selected level/section");
          return;
        }

        const paymentsToInsert = students.map((student) => {
          const newId = uuidv4();

          const retStudent = {
            id: newId,
            student_id: student.id,
            description: formData.description,
            amount: parseFloat(formData.amount),
            due_date: formData.due_date,
            status: "pending" as const,
            semester: formData.semester + " " + formData.school_year,
            billing_type: formData.type,
            year_level: formData.year ? formData.year : "",
            section: formData.section ? formData.section : "",
          };
          return retStudent;
        });

        const { error: insertError } = await supabase
          .from("payments")
          .insert(paymentsToInsert);
        if (insertError) throw insertError;
      }

      await fetchPayments();
      handleCloseModal();

      await LogAction({
        user_id: user?.id,
        action: editingPayment ? "Updated payment" : "Added new billing",
        module: "Financial Admin",
      });
    } catch (error: unknown) {
      console.error(
        "Error saving payment:",
        (error as { message?: string }).message
      );
    }
  };

  const handleMarkAsPaid = async (id: number) => {
    try {
      const { error } = await supabase
        .from("payments")
        .update({
          status: "paid",
          paid_date: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      await fetchPayments();
    } catch (error) {
      console.error("Error marking as paid:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (
      window.confirm("Are you sure you want to delete this payment record?")
    ) {
      try {
        const { error } = await supabase.from("payments").delete().eq("id", id);
        if (error) throw error;
        await fetchPayments();

        await LogAction({
          user_id: user?.id,
          action: "Deleted payment",
          module: "Financial Admin",
        });
      } catch (error) {
        console.error("Error deleting payment:", error);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPayment(null);
    setFormData({
      description: "",
      amount: "",
      due_date: "",
      semester: "",
      type: "",
      year: "",
      section: "",
      school_year: "",
    });
    setShowYearSelection(false);
    setShowSectionSelection(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200";
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200";
      case "overdue":
        return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner size="lg" text="Loading payment data..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CreditCard className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Payment Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {isAdmin
                  ? "Manage student payments and billing"
                  : "View your payment history"}
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Billing
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Amount Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Total Amount
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Paid Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Paid
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatCurrency(paidAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Pending Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
              <Calendar className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Pending
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatCurrency(pendingAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Overdue Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Overdue
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatCurrency(overdueAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Billing Records
            </h2>
            {/* <button className="flex items-center px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button> */}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                {isAdmin && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Year/Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {payment.description}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {payment.semester}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(payment.due_date).toLocaleDateString()}
                    {payment.paid_date && (
                      <div className="text-xs text-green-600 dark:text-green-400">
                        Paid: {new Date(payment.paid_date).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        payment.status
                      )}`}
                    >
                      {payment.status === "paid" ? (
                        <CheckCircle className="h-4 w-4 mr-1" />
                      ) : payment.status === "pending" ? (
                        <Calendar className="h-4 w-4 mr-1" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 mr-1" />
                      )}
                      <span className="capitalize">{payment.status}</span>
                    </span>
                  </td>
                  {isAdmin && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {payment.year_level} / {payment.section}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {payment.status !== "paid" && (
                            <button
                              onClick={() => handleMarkAsPaid(payment.id)}
                              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors"
                            >
                              Mark Paid
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingPayment(payment);
                              setFormData({
                                description: payment.description,
                                amount: payment.amount.toString(),
                                due_date: payment.due_date,
                                semester: payment.semester,
                                type: payment.type,
                                year: payment.year_level || "",
                                section: payment.section || "",
                                school_year: payment.school_year || "",
                              });
                              setIsModalOpen(true);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(payment.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add/Edit Payment */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {editingPayment ? "Edit Payment" : "Add New Billing"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Description
                  </label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    required
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter payment description"
                  />
                </div>

                <div>
                  <label
                    htmlFor="amount"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Amount (PHP)
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    required
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      handleInputChange("amount", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label
                    htmlFor="due_date"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="due_date"
                    name="due_date"
                    required
                    value={formData.due_date}
                    onChange={(e) =>
                      handleInputChange("due_date", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="type"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Semester
                  </label>

                  <select
                    id="semester"
                    name="semester"
                    required
                    value={formData.semester}
                    onChange={(e) =>
                      handleInputChange("semester", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select semester</option>
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="3rd Semester">3rd Semester</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="type"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    School Year
                  </label>

                  <select
                    id="school_year"
                    name="school_year"
                    required
                    value={formData.school_year}
                    onChange={(e) =>
                      handleInputChange("school_year", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    {schoolYear.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="type"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    required
                    value={formData.type}
                    onChange={(e) => handleInputChange("type", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select type</option>
                    <option value="Tuition">Tuition</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                    <option value="Medical">Medical</option>
                    <option value="Library">Library</option>
                  </select>
                </div>

                {isAdmin && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Apply To
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-4">
                          <button
                            type="button"
                            onClick={() => {
                              setShowYearSelection(!showYearSelection);
                              setShowSectionSelection(false);
                            }}
                            className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            <span>Year {formData.year}</span>
                            {showYearSelection ? (
                              <ChevronUp className="h-4 w-4 ml-2" />
                            ) : (
                              <ChevronDown className="h-4 w-4 ml-2" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setShowSectionSelection(!showSectionSelection);
                              setShowYearSelection(false);
                            }}
                            className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            <span>Section: {formData.section}</span>
                            {showSectionSelection ? (
                              <ChevronUp className="h-4 w-4 ml-2" />
                            ) : (
                              <ChevronDown className="h-4 w-4 ml-2" />
                            )}
                          </button>
                        </div>

                        {showYearSelection && (
                          <div className="grid grid-cols-3 gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                            {years.map((year) => (
                              <button
                                key={year}
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    year: year,
                                  }));
                                  setShowYearSelection(false);
                                }}
                                className={`px-3 py-1 text-sm rounded ${
                                  formData.year === year
                                    ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200"
                                    : "bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500"
                                }`}
                              >
                                {year}
                              </button>
                            ))}
                          </div>
                        )}

                        {showSectionSelection && (
                          <div className="grid grid-cols-3 gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                            {sections.map((section) => (
                              <button
                                key={section}
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    section: section,
                                  }));
                                  setShowSectionSelection(false);
                                }}
                                className={`px-3 py-1 text-sm rounded ${
                                  formData.section === section
                                    ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200"
                                    : "bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500"
                                }`}
                              >
                                {section}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

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
                    onClick={handleSubmit}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                  >
                    {editingPayment ? "Update" : "Submit Billing"}
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

export default FinancialAdmin;
