import React from "react";
import {
  GraduationCap,
  BookOpen,
  Users,
  Calendar,
  Award,
  Globe,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../auth/LoginForm";

const GuestDashboard: React.FC = () => {
  const navigate = useNavigate();
  const features = [
    {
      icon: BookOpen,
      title: "Academic Programs",
      description:
        "Explore our diverse range of undergraduate and graduate programs",
      color: "blue",
    },
    {
      icon: Users,
      title: "Faculty & Staff",
      description: "Meet our distinguished faculty and support staff",
      color: "green",
    },
    {
      icon: Calendar,
      title: "Events & News",
      description: "Stay updated with campus events and university news",
      color: "purple",
    },
    {
      icon: Award,
      title: "Achievements",
      description: "Discover our students' and faculty's accomplishments",
      color: "yellow",
    },
  ];

  const stats = [
    { label: "Students Enrolled", value: "12,500+" },
    { label: "Faculty Members", value: "850+" },
    { label: "Academic Programs", value: "150+" },
    { label: "Research Centers", value: "25+" },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
      green:
        "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
      purple:
        "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
      yellow:
        "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };
  const goToLoginPage = () => {
    navigate("/login");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <div className="mx-auto w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mb-6">
          <GraduationCap className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to ICAS Sucat Portal
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Discover excellence in education, research, and innovation. Join our
          vibrant community of learners, educators, and researchers committed to
          shaping the future.
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {stat.value}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Features Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
          Explore Our University
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-4">
                <div
                  className={`p-3 rounded-lg ${getColorClasses(feature.color)}`}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white">
        <Globe className="h-12 w-12 mx-auto mb-4 opacity-90" />
        <h2 className="text-2xl font-bold mb-4">
          Ready to Join Our Community?
        </h2>
        <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
          Whether you're a prospective student, current student, or faculty
          member, our portal provides all the tools you need for academic
          success.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={goToLoginPage}
            className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Learn More About Programs
          </button>
          {/* <button className="bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            Contact Admissions
          </button> */}
        </div>
      </div>

      {/* Information Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          About This Portal
        </h2>
        <div className="text-gray-600 dark:text-gray-400 space-y-3">
          <p>
            This student portal provides comprehensive access to academic and
            administrative services. Students can view grades, manage
            enrollment, handle financial matters, and access important
            documents.
          </p>
          <p>
            Administrators have access to student management tools, academic
            oversight features, and detailed audit trails for system security
            and compliance.
          </p>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            To access the portal features, please log in with your university
            credentials or create an account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GuestDashboard;
