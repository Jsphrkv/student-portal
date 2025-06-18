import React, { useState, useEffect } from "react";
import {
  CreditCard,
  DollarSign,
  Download,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../../lib/supabase";
import LoadingSpinner from "../shared/LoadingSpinner";

interface Payment {
  id: string;
  type: string;
  amount: number;
  due_date: string;
  status: "pending" | "paid" | "overdue";
  description: string;
  paid_date?: string;
  created_at: string;
}

const Financial: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [selectedPayment, setSelectedPayment] = useState<string | null>(null);

  useEffect(() => {
    const fetchFinancialData = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch all payments for the current student
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select("*")
          .eq("student_id", user.id)
          .order("due_date", { ascending: true });

        if (paymentsError) throw paymentsError;

        // Separate into outstanding payments and payment history
        const outstanding = paymentsData.filter((p) => p.status !== "paid");
        const history = paymentsData.filter((p) => p.status === "paid");

        setPayments(outstanding);
        setPaymentHistory(history);
      } catch (error) {
        console.error("Error fetching financial data:", error);
        setError("Failed to load financial information. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFinancialData();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
      case "pending":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20";
      case "overdue":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const today = new Date();

  const overdueAmount = payments
    .filter((p) => !p.paid_date && new Date(p.due_date) < today)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOwed = payments.reduce((sum, p) => sum + p.amount, 0);

  const nextDueDate =
    payments.length > 0
      ? new Date(payments[0].due_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "No pending payments";

  const handlePayment = async (paymentId: string) => {
    try {
      // In a real implementation, this would integrate with Stripe/Payment processor
      // For now, we'll simulate a successful payment
      const { error } = await supabase
        .from("payments")
        .update({
          status: "paid",
          paid_date: new Date().toISOString(),
        })
        .eq("id", paymentId);

      if (error) throw error;

      // Refresh the data
      const payment = payments.find((p) => p.id === paymentId);
      if (payment) {
        setPayments(payments.filter((p) => p.id !== paymentId));
        setPaymentHistory([
          ...paymentHistory,
          {
            ...payment,
            status: "paid",
            paid_date: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Payment failed. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner size="lg" text="Loading financial information..." />
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
          Financial Information
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your payments and view financial history
        </p>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Current Balance
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ${totalOwed.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Overdue Amount
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                ${overdueAmount.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Next Due Date
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {nextDueDate}
              </p>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outstanding Payments */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Outstanding Payments
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {payment.description}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {payment.type}
                        </p>
                      </div>
                      <div
                        className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          payment.status
                        )}`}
                      >
                        {getStatusIcon(payment.status)}
                        <span>
                          {payment.status.charAt(0).toUpperCase() +
                            payment.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          ${payment.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Due: {new Date(payment.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handlePayment(payment.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>Pay Now</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No outstanding payments
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Payment History
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {paymentHistory.length > 0 ? (
                paymentHistory.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {payment.description}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {payment.paid_date
                          ? new Date(payment.paid_date).toLocaleDateString()
                          : new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        ${payment.amount.toFixed(2)}
                      </p>
                      <button
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-500 text-sm flex items-center space-x-1"
                        onClick={() => {
                          // In a real app, this would download a receipt
                          alert(
                            `Receipt for ${payment.description} would be downloaded`
                          );
                        }}
                      >
                        <Download className="h-3 w-3" />
                        <span>Receipt</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No payment history found
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Financial;
