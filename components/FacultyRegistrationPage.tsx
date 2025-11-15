import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase/config';
import { ref, get, update } from "firebase/database";
import { FacultyRecord } from '../types';
import { UserPlus, Search, Loader2, KeyRound, ArrowLeft, User } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface FacultyRegistrationPageProps {
  onRegistrationSuccess: () => void;
  onBackToLogin: () => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

const FacultyRegistrationPage: React.FC<FacultyRegistrationPageProps> = ({
  onRegistrationSuccess,
  onBackToLogin,
  theme,
  onThemeToggle
}) => {

  const [step, setStep] = useState<'search' | 'register'>('search');

  const [allFaculty, setAllFaculty] = useState<FacultyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchBy, setSearchBy] = useState<'name' | 'empId'>('name');

  const [selectedFaculty, setSelectedFaculty] = useState<FacultyRecord | null>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------
  // FETCH FACULTY LIST (v10 Updated)
  // -------------------------------------
  useEffect(() => {
    const fetchFaculty = async () => {
      setLoading(true);
      try {
        const facultySnap = await get(ref(db, "faculty"));

        if (facultySnap.exists()) {
          const data = facultySnap.val();
          const list: FacultyRecord[] = Object.keys(data).map(empId => ({
            empId: parseInt(empId),
            ...data[empId],
          }));
          setAllFaculty(list);
        }
      } catch (err) {
        setError("Failed to fetch faculty data. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchFaculty();
  }, []);

  // -------------------------------------
  // SEARCH RESULTS
  // -------------------------------------
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();

    return allFaculty
      .filter(f => !f.registered)
      .filter(f => {
        if (searchBy === 'empId') return String(f.empId).includes(query);
        return f.name.toLowerCase().includes(query);
      })
      .slice(0, 10);
  }, [searchQuery, searchBy, allFaculty]);

  const handleSelectFaculty = (faculty: FacultyRecord) => {
    if (faculty.registered) {
      setError("This faculty member is already registered.");
      return;
    }
    setSelectedFaculty(faculty);
    setStep("register");
    setError(null);
  };

  // -------------------------------------
  // HANDLE REGISTRATION (v10 Updated)
  // -------------------------------------
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedFaculty) {
      setError("No faculty member selected.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsRegistering(true);

    try {
      // Prevent username duplication
      const isTaken = allFaculty.some(f => f.username === username);
      if (isTaken) {
        throw new Error("This email is already in use by another faculty member.");
      }

      // Update faculty
      const facultyRef = ref(db, `faculty/${selectedFaculty.empId}`);

      await update(facultyRef, {
        username: username,
        password: btoa(password),
        registered: true,
      });

      onRegistrationSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  // -------------------------------------
  // UI
  // -------------------------------------
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary dark:bg-gray-900 p-4 font-sans relative">

      <div className="absolute top-4 right-4">
        <ThemeToggle theme={theme} onToggle={onThemeToggle} />
      </div>

      <div className="w-full max-w-md">

        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 text-highlight dark:text-teal-300 bg-highlight/10 rounded-full flex items-center justify-center">
            <UserPlus size={32} />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-highlight dark:text-teal-300">
            Faculty Account Registration
          </h1>
        </div>

        {/* CONTENT CARD */}
        <div className="p-8 bg-secondary rounded-xl shadow-lg dark:bg-gray-800">

          {error && (
            <p className="mb-4 text-center text-sm text-red-600 dark:text-red-400 p-3 bg-red-100 dark:bg-red-900/50 rounded-md">
              {error}
            </p>
          )}

          {/* STEP 1 — SEARCH */}
          {step === 'search' ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-text-primary dark:text-gray-100">Find Your Profile</h3>
                <p className="text-sm text-text-secondary dark:text-gray-400">
                  Search for your name or employee ID to begin registration.
                </p>
              </div>

              <div className="flex gap-2">
                <select
                  value={searchBy}
                  onChange={e => setSearchBy(e.target.value as 'name' | 'empId')}
                  className="bg-primary border border-accent rounded-md p-2 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="name">Name</option>
                  <option value="empId">Emp. ID</option>
                </select>

                <div className="relative flex-grow">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary dark:text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={`Search by ${searchBy === 'name' ? 'Name' : 'Employee ID'}...`}
                    className="w-full bg-primary border border-accent rounded-md p-2 pl-10 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>

              {/* SEARCH RESULTS */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="animate-spin" />
                  </div>
                ) : (
                  searchResults.map(f => (
                    <button
                      key={f.empId}
                      onClick={() => handleSelectFaculty(f)}
                      className="w-full text-left p-3 rounded-md hover:bg-accent dark:hover:bg-gray-700/50 flex items-center gap-4"
                    >
                      <div className="bg-highlight/20 p-2 rounded-full">
                        <User className="text-highlight" size={20} />
                      </div>
                      <div>
                        <p className="font-semibold">{f.name}</p>
                        <p className="text-sm text-text-secondary dark:text-gray-400">
                          ID: {f.empId} | Dept: {f.dept}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            // STEP 2 — REGISTER
            selectedFaculty && (
              <form onSubmit={handleRegister} className="space-y-4">

                <div>
                  <h3 className="text-xl font-semibold text-text-primary dark:text-gray-100">
                    Create Your Account
                  </h3>
                  <p className="text-sm text-text-secondary dark:text-gray-400">
                    Set a username and password for your profile.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-primary dark:bg-gray-900/50 border border-accent dark:border-gray-700">
                  <p className="font-bold text-lg text-highlight dark:text-teal-300">
                    {selectedFaculty.name}
                  </p>
                  <p className="text-sm text-text-secondary dark:text-gray-400">
                    ID: {selectedFaculty.empId} | {selectedFaculty.dept} | {selectedFaculty.designation}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary dark:text-gray-400">
                    Username (Email ID)
                  </label>
                  <input
                    type="email"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="mt-1 w-full bg-primary border border-accent rounded-md p-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary dark:text-gray-400">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="mt-1 w-full bg-primary border border-accent rounded-md p-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary dark:text-gray-400">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="mt-1 w-full bg-primary border border-accent rounded-md p-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row-reverse gap-3">
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full sm:w-auto flex justify-center items-center gap-2 bg-highlight text-primary font-bold py-2 px-4 rounded-md hover:bg-teal-300 disabled:bg-gray-500"
                  >
                    {isRegistering ? <Loader2 className="animate-spin" /> : <KeyRound size={18} />}
                    Create Account
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep("search")}
                    className="w-full sm:w-auto text-center py-2 px-4 text-sm text-text-secondary hover:bg-accent dark:hover:bg-gray-700/50 rounded-md"
                  >
                    Choose a different profile
                  </button>
                </div>

              </form>
            )
          )}

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

export default FacultyRegistrationPage;
