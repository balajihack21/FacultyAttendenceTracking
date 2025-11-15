import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import UploadPage from './components/UploadPage';
import FacultyPage from './components/FacultyPage';
import SummaryPage from './components/SummaryPage';
import SettingsPage from './components/SettingsPage';
import FacultyDetailPage from './components/FacultyDetailPage';
import LoginPage from './components/LoginPage';
import UserManagementPage from './components/UserManagementPage';
import FacultyRegistrationPage from './components/FacultyRegistrationPage';
import AdminRegistrationPage from './components/AdminRegistrationPage';
import FacultyDashboard from './components/FacultyDashboard';
import LeaveApprovalPage from './components/LeaveApprovalPage';
import { useAttendanceData } from './hooks/useAttendanceData';
import { LayoutDashboard, Upload, Users, Sheet, Settings as SettingsIcon, LogOut, UserCog, CalendarCheck } from 'lucide-react';
import ThemeToggle from './components/ThemeToggle';

type User = {
    username: string;
    role: 'admin' | 'faculty';
    empId?: number;
};

const App: React.FC = () => {
  const [page, setPage] = useState<'dashboard' | 'upload' | 'faculty' | 'summary' | 'settings' | 'facultyDetail' | 'userManagement' | 'facultyRegistration' | 'facultyDashboard' | 'leaveApprovals' | 'adminRegistration'>('dashboard');
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);
  const [previousPage, setPreviousPage] = useState<'dashboard' | 'faculty' | 'summary'>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginSuccessMessage, setLoginSuccessMessage] = useState('');
  
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  );
  const attendanceData = useAttendanceData();

  useEffect(() => {
    const loggedIn = sessionStorage.getItem('isAuthenticated');
    const userJson = sessionStorage.getItem('currentUser');
    if (loggedIn === 'true' && userJson) {
      const user: User = JSON.parse(userJson);
      setIsAuthenticated(true);
      setCurrentUser(user);
      // On refresh, direct user to appropriate dashboard
      setPage(user.role === 'faculty' ? 'facultyDashboard' : 'dashboard');
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLoginSuccess = (user: User) => {
    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    setIsAuthenticated(true);
    setCurrentUser(user);
    setPage(user.role === 'faculty' ? 'facultyDashboard' : 'dashboard');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('currentUser');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setPage('dashboard');
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  
  const handleFacultySelect = (empId: number) => {
    if(page === 'dashboard' || page === 'faculty' || page === 'summary') {
      setPreviousPage(page);
    }
    setSelectedEmpId(empId);
    setPage('facultyDetail');
  };

  const handleBack = () => {
    setSelectedEmpId(null);
    setPage(previousPage);
  };
  
  const handleRegistrationSuccess = () => {
    setLoginSuccessMessage('Account created successfully. Please log in.');
    setPage('dashboard');
  };

  const handleAdminRegistrationRequestSuccess = () => {
    setLoginSuccessMessage('Your account request has been submitted for approval.');
    setPage('dashboard');
  };

  const NavButton: React.FC<{
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }> = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out border-b-2 ${
        active
          ? 'bg-highlight/10 text-highlight border-highlight dark:bg-highlight/20 dark:border-highlight'
          : 'text-text-secondary border-transparent hover:bg-accent hover:text-text-primary dark:text-slate-400 dark:hover:bg-dark-accent/50 dark:hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  );
  
  const renderPage = () => {
    if (currentUser?.role === 'faculty') {
        if (currentUser.empId) {
            return <FacultyDashboard empId={currentUser.empId} theme={theme} />;
        }
        return <div>Error: Faculty user is not linked to an employee ID.</div>
    }

    // Admin pages
    switch(page) {
      case 'dashboard':
        return <Dashboard {...attendanceData} theme={theme} onFacultySelect={handleFacultySelect} />;
      case 'upload':
        return <UploadPage
            handleFileUpload={attendanceData.handleFileUpload}
            loading={attendanceData.loading}
            uploadStatus={attendanceData.uploadStatus}
            clearUploadStatus={attendanceData.clearUploadStatus}
          />;
      case 'faculty':
        return <FacultyPage theme={theme} onFacultySelect={handleFacultySelect} />;
      case 'summary':
        return <SummaryPage onFacultySelect={handleFacultySelect} />;
      case 'settings':
        return <SettingsPage />;
      case 'leaveApprovals':
        return <LeaveApprovalPage />;
      case 'facultyDetail':
        return selectedEmpId ? <FacultyDetailPage empId={selectedEmpId} onBack={handleBack} theme={theme} /> : <Dashboard {...attendanceData} theme={theme} onFacultySelect={handleFacultySelect} />;
      case 'userManagement':
        return <UserManagementPage />;
      default:
        return <Dashboard {...attendanceData} theme={theme} onFacultySelect={handleFacultySelect} />;
    }
  }

  if (!isAuthenticated) {
    if (page === 'facultyRegistration') {
        return <FacultyRegistrationPage onRegistrationSuccess={handleRegistrationSuccess} onBackToLogin={() => setPage('dashboard')} theme={theme} onThemeToggle={handleThemeToggle} />;
    }
    if (page === 'adminRegistration') {
        return <AdminRegistrationPage onRegistrationRequestSuccess={handleAdminRegistrationRequestSuccess} onBackToLogin={() => setPage('dashboard')} theme={theme} onThemeToggle={handleThemeToggle} />;
    }
    return <LoginPage onLoginSuccess={handleLoginSuccess} onGoToRegister={() => setPage('facultyRegistration')} onGoToAdminRegister={() => setPage('adminRegistration')} successMessage={loginSuccessMessage} theme={theme} onThemeToggle={handleThemeToggle} />;
  }

  return (
    <div className="min-h-screen bg-primary font-sans dark:bg-dark-primary">
      <header className="bg-secondary p-4 shadow-md flex flex-col sm:flex-row justify-between items-center gap-4 dark:bg-dark-secondary dark:border-b dark:border-dark-accent">
        <h1 className="text-xl md:text-2xl font-bold text-highlight text-center sm:text-left dark:text-teal-400">
          ACT HR Management
        </h1>
        <nav className="flex items-center gap-2 flex-wrap justify-center">
            {currentUser?.role === 'admin' ? (
                <>
                    <NavButton active={page === 'dashboard'} onClick={() => setPage('dashboard')}>
                        <LayoutDashboard size={16} />
                        Dashboard
                    </NavButton>
                    <NavButton active={page === 'upload'} onClick={() => setPage('upload')}>
                        <Upload size={16} />
                        Upload Data
                    </NavButton>
                    <NavButton active={page === 'faculty'} onClick={() => setPage('faculty')}>
                        <Users size={16} />
                        Faculty
                    </NavButton>
                    <NavButton active={page === 'summary'} onClick={() => setPage('summary')}>
                        <Sheet size={16} />
                        Summary
                    </NavButton>
                    <NavButton active={page === 'leaveApprovals'} onClick={() => setPage('leaveApprovals')}>
                        <CalendarCheck size={16} />
                        Leave Requests
                    </NavButton>
                    <NavButton active={page === 'settings'} onClick={() => setPage('settings')}>
                        <SettingsIcon size={16} />
                        Settings
                    </NavButton>
                    <NavButton active={page === 'userManagement'} onClick={() => setPage('userManagement')}>
                        <UserCog size={16} />
                        User Management
                    </NavButton>
                </>
            ) : (
                <NavButton active={page === 'facultyDashboard'} onClick={() => setPage('facultyDashboard')}>
                    <LayoutDashboard size={16} />
                    My Dashboard
                </NavButton>
            )}
            <ThemeToggle theme={theme} onToggle={handleThemeToggle} />
            <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900"
            >
                <LogOut size={16} />
                Logout
            </button>
        </nav>
      </header>
      <main className="p-4 md:p-8">
        {renderPage()}
      </main>
      <footer className="text-center p-4 text-text-secondary text-sm dark:text-slate-400 border-t border-accent dark:border-dark-accent">
        <p>Built with React, Tailwind CSS, and Firebase</p>
      </footer>
    </div>
  );
};

export default App;