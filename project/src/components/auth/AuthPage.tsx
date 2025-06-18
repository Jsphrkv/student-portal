import React, { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';

type FormType = 'login' | 'register' | 'forgot';

interface AuthPageProps {
  onGuestAccess: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onGuestAccess }) => {
  const [currentForm, setCurrentForm] = useState<FormType>('login');

  const renderForm = () => {
    switch (currentForm) {
      case 'login':
        return <LoginForm onToggleForm={setCurrentForm} />;
      case 'register':
        return <RegisterForm onToggleForm={setCurrentForm} />;
      case 'forgot':
        return <ForgotPasswordForm onToggleForm={setCurrentForm} />;
      default:
        return <LoginForm onToggleForm={setCurrentForm} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            ICAS Sucat Portal
          </h1>
        </div>

        {renderForm()}

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onGuestAccess}
            className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;