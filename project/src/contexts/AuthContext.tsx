import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  User,
  Student,
  StudentRegistrationData,
  AuthContextType,
} from "../types";
import { supabase } from "../../lib/supabase";
// import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const navigate = useNavigate();

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

      if (authError) throw authError;

      if (data.user) {
        // Fetch user profile from users table
        const { data: userProfile, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (userError) throw userError;

        const userData: User = {
          id: userProfile.id,
          first_name: userProfile.first_name,
          last_name: userProfile.last_name,
          email: userProfile.email,
          role: userProfile.role,
          created_at: userProfile.created_at,
        };

        setUser(userData);

        // Fetch student profile if user is a student
        if (userProfile.role === "student") {
          const { data: studentData, error: studentError } = await supabase
            .from("student")
            .select("*")
            .eq("id", data.user.id)
            .single();

          if (studentError) {
            console.warn("Student profile not found:", studentError);
          } else {
            setStudent(studentData);
          }
        }

        const currentPath = window.location.pathname;
        if (userProfile.role === "admin" && !currentPath.startsWith("/admin")) {
          navigate("/admin/dashboard");
        } else if (
          userProfile.role === "student" &&
          currentPath !== "/dashboard"
        ) {
          navigate("/dashboard");
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Login failed");
      } else {
        setError("Unexpected error");
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  const register = async (studentData: StudentRegistrationData) => {
    setIsLoading(true);
    setError(null);

    const newStudentID = generateStudentID();

    try {
      // First, create the auth user
      const { data, error: authError } = await supabase.auth.signUp({
        email: studentData.email,
        password: studentData.password,
      });

      if (authError) throw authError;

      if (data.user) {
        // Create user profile in users table
        const { error: userError, data: insertedUser } = await supabase
          .from("users")
          .insert([
            {
              id: data.user.id, // Use the auth user's ID
              email: studentData.email,
              first_name: studentData.first_name,
              last_name: studentData.last_name,
              role: "student",
            },
          ])
          .select()
          .single();

        if (userError) throw userError;

        // Create student profile in student table
        const { data: studentProfile, error: profileError } = await supabase
          .from("student")
          .insert([
            {
              id: data.user.id, // Use the same ID as the user
              year: studentData.year,
              birthdate: studentData.birthdate,
              age: studentData.age,
              sex: studentData.sex.toLowerCase(),
              section: studentData.section,
              contact: parseInt(studentData.contact),
              student_id: newStudentID,
              user_id: data.user.id, // Reference the user's ID
            },
          ])
          .select()
          .single();

        if (profileError) throw profileError;

        const userData: User = {
          id: data.user.id,
          email: data.user.email!,
          first_name: insertedUser.first_name,
          last_name: insertedUser.last_name,
          role: "student",
          created_at: data.user.created_at,
        };

        setUser(userData);
        setStudent(studentProfile);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Registration failed");
      } else {
        setError("Unexpected error");
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);

    try {
      await supabase.auth.signOut();
      setUser(null);
      setStudent(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.message);
      } else {
        console.error("Unexpected error", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        // Fetch user profile
        const { data: userProfile } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (userProfile) {
          const userData: User = {
            id: userProfile.id,
            email: userProfile.email,
            first_name: userProfile.first_name,
            last_name: userProfile.last_name,
            role: userProfile.role,
            created_at: userProfile.created_at,
          };

          setUser(userData);

          // Fetch student profile if user is a student
          if (userProfile.role === "student") {
            const { data: studentData } = await supabase
              .from("student")
              .select("*")
              .eq("id", session.user.id)
              .single();

            if (studentData) {
              setStudent(studentData);
            }
          }
        }
      }
    };

    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        setStudent(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    student,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

function generateStudentID(): string {
  const randomNum = Math.floor(Math.random() * 1000000); // 0 to 999999
  const paddedNum = String(randomNum).padStart(6, "0"); // Ensure 6 digits
  return `STU${paddedNum}`;
}
