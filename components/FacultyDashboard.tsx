import React from 'react';
import { useFacultyDetailData } from '../hooks/useFacultyDetailData';
import { Loader2, User, Briefcase, Building, Clock, AlertTriangle, UserX, ClipboardCheck, Calendar as CalendarIcon, CalendarCheck } from 'lucide-react';
import CalendarView from './CalendarView';
import LeaveManagement from './LeaveManagement';
import FacultyDetailPage from './FacultyDetailPage'; // Re-using for now, can be split later

interface FacultyDashboardProps {
  empId: number;
  theme: 'light' | 'dark';
}

const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ empId, theme }) => {
  // We can just render the FacultyDetailPage and pass an empty onBack function
  // to effectively create the faculty dashboard without duplicating a massive amount of code.
  // The 'Back' button will be present but won't do anything disruptive.
  // A better long-term solution would be to refactor FacultyDetailPage to be more modular.
  
  // For the purpose of this request, let's pass a dummy onBack function
  const handleBack = () => {};

  return <FacultyDetailPage empId={empId} onBack={handleBack} theme={theme} />;
};

export default FacultyDashboard;
