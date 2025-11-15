import React, { useState } from 'react';
import { db } from '../firebase/config';
import { ref, get, set } from "firebase/database";
import { UserPlus, Loader2, KeyRound, ArrowLeft } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface AdminRegistrationPageProps {
  onRegistrationRequestSuccess: () => void;
  onBackToLogin: () => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

const encodeEmailForKey = (email: string) => email.replace(/\./g, ',');

const AdminRegistrationPage: React.FC<AdminRegistrationPageProps> = ({
  onRegistrationRequestSuccess,
  onBackToLogin,
  theme,
  onThemeToggle
}) => {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (username.trim().toLowerCase() === 'admin') {
      setError("The username 'admin' is reserved.");
      return;
    }

    setIsRegistering(true);

    try {
      const cleanUsername = username.trim();
      const encodedUsername = encodeEmailForKey(cleanUsername);

      const pendingRef = ref(db, `pendingUsers/${encodedUsername}`);
      const userRef = ref(db, `users/${encodedUsername}`);
      const facultyRef = ref(db, `faculty`);

      const [pendingSnap, userSnap, facultySnap] = await Promise.all([
        get(pendingRef),
        get(userRef),
        get(facultyRef)
      ]);

      let isUsernameTakenInFaculty = false;
      if (facultySnap.exists()) {
        const facultyData = facultySnap.val();
        for (const empId in facultyData) {
          if (facultyData[empId].username === cleanUsername) {
            isUsernameTakenInFaculty = true;
            break;
          }
        }
      }

      if (pendingSnap.exists() || userSnap.exists() || isUsernameTakenInFaculty) {
        throw new Error("This username is already taken or pending approval.");
      }

      await set(pendingRef, {
        username: cleanUsername,
        password: btoa(password),
      });

      onRegistrationRequestSuccess();

    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration request failed. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary dark:bg-gray-900 p-4 font-sans relative">
      
      <div className="absolute top-4 right-4">
        <ThemeToggle theme={theme} onToggle={onThemeToggle} />
      </div>

      <div className="w-full max-w-md">
        
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 text-highlight dark:text-teal-300 bg-highlight/10 rounded-full flex items-center justify-center">
            <UserPlus size={32} />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-highlight dark:text-teal-300">
            Request General User Account
          </h1>
          <p className="text-sm text-text-secondary dark:text-gray-400">
            Your request will be sent to an administrator for approval.
          </p>
        </div>

        <div className="p-8 bg-secondary rounded-xl shadow-lg dark:bg-gray-800">

          {error && (
            <p className="mb-4 text-center text-sm text-red-600 dark:text-red-400 p-3 bg-red-100 dark:bg-red-900/50 rounded-md">
              {error}
            </p>
          )}

          <form onSubmit={handleRegister} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-text-secondary dark:text-gray-400">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="mt-1 w-full bg-primary border border-accent rounded-md p-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary dark:text-gray-400">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="mt-1 w-full bg-primary border border-accent rounded-md p-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary dark:text-gray-400">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="mt-1 w-full bg-primary border border-accent rounded-md p-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div className="pt-2 flex flex-col">
              <button
                type="submit"
                disabled={isRegistering}
                className="w-full flex justify-center items-center gap-2 bg-highlight text-primary font-bold py-2 px-4 rounded-md hover:bg-teal-300 disabled:bg-gray-500"
              >
                {isRegistering ? <Loader2 className="animate-spin" /> : <KeyRound size={18} />}
                Request Account
              </button>
            </div>

          </form>

        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onBackToLogin}
            className="flex items-center gap-2 mx-auto text-sm text-text-secondary hover:text-highlight dark:text-gray-400 dark:hover:text-teal-400"
          >
            <ArrowLeft size={16} />
            Back to Login
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminRegistrationPage;
