import React, { useState } from "react";
import {
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../../lib/supabase";

interface SupportRequest {
  id?: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status?: "open" | "in_progress" | "resolved";
  created_at?: string;
  user_id?: string;
}

const Support: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState<SupportRequest>({
    name: user ? `${user.first_name} ${user.last_name}` : "",
    email: user?.email || "",
    subject: "",
    message: "",
  });
  const [submitStatus, setSubmitStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const faqs = [
    {
      id: 1,
      question: "How do I reset my password?",
      answer:
        'You can reset your password by clicking the "Forgot Password" link on the login page. Enter your email address and follow the instructions sent to your email.',
    },
    {
      id: 2,
      question: "How can I view my grades?",
      answer:
        'Your grades are available in the Student Profile section. Click on "Profile" in the navigation menu and scroll down to the Academic Records section.',
    },
    {
      id: 3,
      question: "When are payments due?",
      answer:
        "Payment due dates vary by semester and fee type. You can view all your payment obligations and due dates in the Payments section of your dashboard.",
    },
    {
      id: 4,
      question: "How do I update my contact information?",
      answer:
        'Go to your Profile page and click the "Edit Profile" button. You can update your contact information, address, and other personal details.',
    },
    {
      id: 5,
      question: "Where can I find the academic calendar?",
      answer:
        "The academic calendar is available on the main dashboard and in the Announcements section. Important dates are also highlighted in your personal calendar.",
    },
    {
      id: 6,
      question: "How do I contact my professors?",
      answer:
        "Professor contact information is available through the student portal. You can also reach out through the official channels provided by your department.",
    },
    {
      id: 7,
      question: "What should I do if I have technical issues?",
      answer:
        "For technical issues with the portal, please contact our IT support team using the contact form below or call our technical support hotline.",
    },
    {
      id: 8,
      question: "How can I apply for financial aid?",
      answer:
        "Financial aid applications are processed through the Student Affairs office. Please visit them in person or contact them directly for application procedures.",
    },
  ];

  const handleContactFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContactFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus(null);

    try {
      const { data, error } = await supabase
        .from("support_requests")
        .insert([
          {
            ...contactForm,
            user_id: user?.id,
            status: "open",
          },
        ])
        .select();

      if (error) throw error;

      setSubmitStatus({
        success: true,
        message:
          "Support request submitted successfully! We'll get back to you soon.",
      });

      // Reset form
      setContactForm({
        ...contactForm,
        subject: "",
        message: "",
      });
    } catch (error) {
      setSubmitStatus({
        success: false,
        message: "Failed to submit support request. Please try again.",
      });
      console.error("Error submitting support request:", error);
    }
  };

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3">
          <HelpCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Support Center
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Get help and find answers to your questions
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - FAQ and Search */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search FAQ */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search FAQ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* FAQ List */}
            <div className="space-y-3">
              {filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg"
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="font-medium text-gray-900 dark:text-white">
                      {faq.question}
                    </span>
                    {expandedFaq === faq.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    )}
                  </button>
                  {expandedFaq === faq.id && (
                    <div className="px-4 pb-3 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                      <p className="text-gray-700 dark:text-gray-300 pt-3">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredFaqs.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No FAQ items match your search.
                </p>
              </div>
            )}
          </div>

          {/* Contact Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <MessageCircle className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
              Contact Us
            </h2>
            <form onSubmit={handleContactFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={contactForm.name}
                    onChange={handleContactFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={contactForm.email}
                    onChange={handleContactFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  value={contactForm.subject}
                  onChange={handleContactFormChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a subject</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Account Issues">Account Issues</option>
                  <option value="Academic Records">Academic Records</option>
                  <option value="Payment Issues">Payment Issues</option>
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={contactForm.message}
                  onChange={handleContactFormChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Describe your issue or question in detail..."
                />
              </div>

              <button
                type="submit"
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - Contact Information */}
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Contact Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Phone
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    (02) 1424-4268
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    +63 913 445 6762
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Email
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    support@icas.edu
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    info@icas.edu
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Address
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    ICAS Sucat Campus
                    <br />
                    CAP Building 8347 Dr. A. Santos Avenue
                    <br />
                    San Antonio, Parañaque City
                    <br />
                    Metro Manila, Philippines
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Office Hours
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Monday - Saturday: 8:00 AM - 10:00 PM
                    <br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-3">
              Emergency Contacts
            </h3>
            <div className="space-y-2">
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">
                  Campus Security
                </p>
                <p className="text-red-700 dark:text-red-300">
                  +63 917 123 4567
                </p>
              </div>
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">
                  Medical Emergency
                </p>
                <p className="text-red-700 dark:text-red-300">
                  +63 918 765 4321
                </p>
              </div>
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">
                  IT Emergency
                </p>
                <p className="text-red-700 dark:text-red-300">
                  +63 919 876 5432
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          {/* <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Quick Links
            </h3>
            <div className="space-y-2">
              <a
                href="#"
                className="block text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                Student Handbook
              </a>
              <a
                href="#"
                className="block text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                Academic Calendar
              </a>
              <a
                href="#"
                className="block text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                Campus Map
              </a>
              <a
                href="#"
                className="block text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                Library Resources
              </a>
              <a
                href="#"
                className="block text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                IT Support Portal
              </a>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Support;
