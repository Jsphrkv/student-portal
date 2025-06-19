import React, { useEffect, useState } from "react";
import { User, Mail, Phone, MapPin, Heart, Save, Edit3 } from "lucide-react";
import { supabase } from "../../../lib/supabase"; // Make sure this is properly initialized
import { LogAction } from "../../../utils/logger"; // Adjust the import path as necessary

interface Users {
  id?: string;
}

const Profile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState<Users | null>(null);
  const [formData, setFormData] = useState({
    student_id: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    age: "",
    sex: "",
    address: "",
    section: "",
    year: "",
    emergency_contact_name: "",
    emergency_contact_number: "",
    emergency_contact_relationship: "",
    course_code: "", // Add this line
  });

  const handleSave = async () => {
    // API call to save profile data
    supabase
      .from("student")
      .update({
        contact: formData.phone,
        address: formData.address,
        age: formData.age,
        sex: formData.sex,
        section: formData.section,
        year: formData.year,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_number: formData.emergency_contact_number,
        emergency_contact_relationship: formData.emergency_contact_relationship,
      })
      .eq("id", user ? user.id : "")
      .then(({ error }) => {
        if (error) {
          console.error("Error updating student info:", error.message);
        } else {
          console.log("Profile updated successfully");
        }
      });

    setIsEditing(false);

    await LogAction({
      user_id: user?.id,
      action: "Edit User Profile",
      module: "Profile",
    });
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

      setUser(user);

      const userId = user.id;
      // Fetch from student table
      const { data: studentData, error: studentError } = await supabase
        .from("student")
        .select(
          `
          *,
          course:courses!student_courses_id_fkey(code)
        `
        )
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
        age: studentData.age || "",
        sex: studentData.sex || "",
        address: studentData.address || "",
        section: studentData.section || "",
        year: studentData.year || "",
        emergency_contact_name: studentData.emergency_contact_name || "",
        emergency_contact_number: studentData.emergency_contact_number || "",
        emergency_contact_relationship:
          studentData.emergency_contact_relationship || "",
        course_code: studentData.course?.code || "Not enrolled",
      });
    };

    fetchStudentInfo();
  }, []);
  // <- Add dependency array to avoid infinite loop

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
              Course: {formData.course_code || "Not enrolled"}
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
              {/* First Name */}
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

              {/* Last Name */}
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

              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Age
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="15"
                    max="99"
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {formData.age}
                  </p>
                )}
              </div>

              {/* Sex */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sex
                </label>
                {isEditing ? (
                  <select
                    value={formData.sex}
                    onChange={(e) => handleInputChange("sex", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Sex</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {formData.sex.charAt(0).toUpperCase() +
                      formData.sex.slice(1)}
                  </p>
                )}
              </div>

              {/* Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Section
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) =>
                      handleInputChange("section", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {formData.section}
                  </p>
                )}
              </div>

              {/* Year Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Year Level
                </label>
                {isEditing ? (
                  <select
                    value={formData.year}
                    onChange={(e) => handleInputChange("year", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Year Level</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                  </select>
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {formData.year}
                  </p>
                )}
              </div>
            </div>

            {/* Rest of your fields (Email, Phone, Address) */}
            <div className="mt-4 space-y-4">
              {/* Email */}
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

              {/* Phone */}
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

              {/* Address */}
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
                    value={formData.emergency_contact_name}
                    onChange={(e) =>
                      handleInputChange(
                        "emergency_contact_name",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {formData.emergency_contact_name}
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
                      value={formData.emergency_contact_number}
                      onChange={(e) =>
                        handleInputChange(
                          "emergency_contact_number",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {formData.emergency_contact_number}
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
                      value={formData.emergency_contact_relationship}
                      onChange={(e) =>
                        handleInputChange(
                          "emergency_contact_relationship",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {formData.emergency_contact_relationship}
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
