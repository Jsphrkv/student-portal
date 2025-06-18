import React, { useState } from "react";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

interface ForgotPasswordFormProps {
  onToggleForm: (form: "login" | "register" | "forgot") => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onToggleForm,
}) => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsSubmitted(false);

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Something went wrong.");
      }

      setIsSubmitted(true);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Check Your Email
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            We've sent a password reset link to {email}
          </p>
        </div>

        <button
          onClick={() => onToggleForm("login")}
          className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Reset Password
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Enter your email to receive a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Enter your email"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          {isLoading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => onToggleForm("login")}
          className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to sign in
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
