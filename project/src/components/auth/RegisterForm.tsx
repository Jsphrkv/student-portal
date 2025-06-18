import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  CakeIcon,
  Calendar,
  Users,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { StudentRegistrationData } from "../../types";

interface RegisterFormProps {
  onToggleForm: (form: "login" | "register" | "forgot") => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleForm }) => {
  const { register, isLoading, error } = useAuth();
  const [formData, setFormData] = useState<
    StudentRegistrationData & { confirmPassword: string }
  >({
    first_name: "",
    last_name: "",
    year: "",
    birthdate: "",
    age: 18,
    sex: "",
    section: "",
    email: "",
    contact: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const yearLevels = [
    { value: "1st Year", label: "1st Year" },
    { value: "2nd Year", label: "2nd Year" },
    { value: "3rd Year", label: "3rd Year" },
  ];

  const sections = [
    { value: "A-AM", label: "Section A-AM" },
    { value: "A-PM", label: "Section A-PM" },
    { value: "B", label: "Section B" },
    { value: "C", label: "Section C" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return;
    }

    if (!formData.sex) {
      return;
    }

    if (!formData) {
      console.log("formData is null");
      return;
    }
    try {
      const { ...studentData } = formData;

      await register(studentData);
    } catch (error) {
      console.log(error);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Student Registration
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Create your student account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              First Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="firstName"
                value={formData.first_name}
                onChange={(e) =>
                  handleInputChange("first_name", e.target.value)
                }
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="First name"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.last_name}
              onChange={(e) => handleInputChange("last_name", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Last name"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Email Address *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Enter your email"
              required
            />
          </div>
        </div>

        {/* Contact Number */}
        <div>
          <label
            htmlFor="contact"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Contact Number *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="tel"
              id="contact"
              value={formData.contact}
              onChange={(e) => handleInputChange("contact", e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Enter your contact number"
              required
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="birthdate"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Birthdate *
          </label>
          <div className="relative">
            <CakeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="date"
              id="birthdate"
              value={formData.birthdate}
              onChange={(e) => handleInputChange("birthdate", e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              required
            />
          </div>
        </div>

        {/* Year Level and Section */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="year"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Year Level *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                id="year"
                value={formData.year}
                onChange={(e) => handleInputChange("year", e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                required
              >
                <option value="">Select Year</option>
                {yearLevels.map((year) => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="section"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Section *
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                id="section"
                value={formData.section}
                onChange={(e) => handleInputChange("section", e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                required
              >
                <option value="">Select Section</option>
                {sections.map((section) => (
                  <option key={section.value} value={section.value}>
                    {section.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Age and Sex */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="age"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Age *
            </label>
            <input
              type="number"
              id="age"
              min="16"
              max="100"
              value={formData.age}
              onChange={(e) =>
                handleInputChange("age", parseInt(e.target.value))
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Age"
              required
            />
          </div>

          <div>
            <label
              htmlFor="sex"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Sex *
            </label>
            <select
              id="sex"
              value={formData.sex}
              onChange={(e) => handleInputChange("sex", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              required
            >
              <option value="">Select Sex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Password Fields */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Password *
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Confirm Password *
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) =>
                handleInputChange("confirmPassword", e.target.value)
              }
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Confirm your password"
              required
            />
          </div>
          {formData.password !== formData.confirmPassword &&
            formData.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                Passwords do not match
              </p>
            )}
        </div>

        <button
          type="submit"
          disabled={
            isLoading ||
            formData.password !== formData.confirmPassword ||
            !formData.sex
          }
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
              Creating account...
            </>
          ) : (
            "Create Student Account"
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <button
            onClick={() => onToggleForm("login")}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
