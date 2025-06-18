import React, { useEffect, useState } from "react";
import { User, Mail, Phone, MapPin, Heart, Save, Edit3 } from "lucide-react";
import { supabase } from "../../../lib/supabase"; // Make sure this is properly initialized

const Profile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    student_id: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    emergencyContact: {
      name: "",
      phone: "",
      relationship: "",
    },
  });

  const handleSave = () => {
    // API call to save profile data
    setIsEditing(false);
  };
  useEffect(() => {
    const fetchStudentInfo = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("User not logged in or auth error:", authError?.message);
        return;
      }

      const userId = user.id;
      // Fetch from student table
      const { data: studentData, error: studentError } = await supabase
        .from("student")
        .select("*")
        .eq("id", userId)
        .single();

      if (studentError) {
        console.error("Error fetching student info:", studentError.message);
        return;
      }

      // Fetch from user table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("Error fetching user info:", userError.message);
        return;
      }

      // Set the form data using both responses
      setFormData({
        student_id: studentData.student_id,
        firstName: userData.first_name,
        lastName: userData.last_name,
        email: userData.email,
        phone: studentData.contact,
        address: studentData.address || "",
        emergencyContact: {
          name: studentData.emergency_contact_name || "",
          phone: studentData.emergency_contact_phone || "",
          relationship: studentData.emergency_contact_relationship || "",
        },
      });
    };

    fetchStudentInfo();
  }, []);
  // <- Add dependency array to avoid infinite loop

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith("emergencyContact.")) {
      const emergencyField = field.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [emergencyField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your personal information and preferences
          </p>
        </div>
        <button
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </>
          ) : (
            <>
              <Edit3 className="h-4 w-4" />
              <span>Edit Profile</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture and Basic Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <div className="mx-auto w-24 h-24 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
              <User className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {formData.firstName} {formData.lastName}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Student ID: {formData.student_id}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Computer Science
            </p>
            <div className="mt-4 flex justify-center">
              <span className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {formData.firstName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {formData.lastName}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {formData.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {formData.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Address
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {formData.address}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Heart className="h-5 w-5 mr-2 text-red-500" />
              Emergency Contact
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.emergencyContact.name}
                    onChange={(e) =>
                      handleInputChange("emergencyContact.name", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {formData.emergencyContact.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.emergencyContact.phone}
                      onChange={(e) =>
                        handleInputChange(
                          "emergencyContact.phone",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {formData.emergencyContact.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Relationship
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.emergencyContact.relationship}
                      onChange={(e) =>
                        handleInputChange(
                          "emergencyContact.relationship",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {formData.emergencyContact.relationship}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
