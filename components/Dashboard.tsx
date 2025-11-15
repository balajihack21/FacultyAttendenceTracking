import React from 'react';
import { useAttendanceData } from '../hooks/useAttendanceData';
import StatCards from './StatCards';
import AttendancePieChart from './AttendancePieChart';
import DepartmentBarChart from './DepartmentBarChart';
import AttendanceTable from './AttendanceTable';
import Filters from './Filters';
import FacultySummaryTable from './FacultySummaryTable';
import FirebaseWarning from './FirebaseWarning';
import { Database } from 'lucide-react';

type DashboardProps = ReturnType<typeof useAttendanceData> & { 
  theme: 'light' | 'dark';
  onFacultySelect: (empId: number) => void;
};

const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h3 className="text-xl font-semibold mb-4 text-highlight dark:text-teal-400 pb-2 border-b-2 border-accent dark:border-dark-accent">
        {children}
    </h3>
);

const Dashboard: React.FC<DashboardProps> = ({
  allData,
  filteredData,
  error,
  loading,
  filters,
  setters,
  departments,
  stats,
  pieChartData,
  departmentChartData,
  facultySummaryData,
  clearError,
  theme,
  onFacultySelect
}) => {
  const hasData = allData.length > 0;

  return (
    <div className="space-y-8 relative">
      {loading && (
        <div className="absolute inset-0 bg-primary/80 dark:bg-dark-primary/80 flex items-center justify-center z-50 rounded-lg">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-highlight dark:border-teal-400"></div>
            <p className="text-text-secondary dark:text-gray-400 text-lg">Loading Data...</p>
          </div>
        </div>
      )}

      <FirebaseWarning />

      {error && (
        <div className="bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded-lg relative flex items-center dark:bg-red-900/50 dark:border-red-700 dark:text-red-300" role="alert">
          <strong className="font-bold mr-2">Error:</strong>
          <span className="block sm:inline">{error}</span>
          <button onClick={clearError} className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}

      {!hasData && !loading && !error && (
        <div className="text-center py-20 px-6 bg-secondary rounded-xl shadow-lg dark:bg-dark-secondary">
          <Database className="mx-auto h-16 w-16 text-highlight dark:text-teal-400" />
          <h2 className="mt-6 text-2xl font-semibold text-text-primary dark:text-gray-200">Database is Empty</h2>
          <p className="mt-2 text-text-secondary dark:text-gray-400">
            Navigate to the 'Upload Data' page to populate the database.
          </p>
        </div>
      )}
      
      {hasData && (
        <>
          <div className="p-6 bg-secondary rounded-xl shadow-lg dark:bg-dark-secondary">
            <Filters
                filters={filters}
                setters={setters}
                departments={departments}
            />
          </div>
          <StatCards stats={stats} />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-secondary p-6 rounded-xl shadow-lg h-96 dark:bg-dark-secondary">
                  <SectionHeader>Attendance Status</SectionHeader>
                  <AttendancePieChart data={pieChartData} theme={theme} />
              </div>
              <div className="bg-secondary p-6 rounded-xl shadow-lg h-96 dark:bg-dark-secondary">
                  <SectionHeader>Department Performance</SectionHeader>
                  <DepartmentBarChart data={departmentChartData} theme={theme}/>
              </div>
            </div>

            <div className="lg:col-span-3 bg-secondary p-6 rounded-xl shadow-lg dark:bg-dark-secondary">
              <SectionHeader>Detailed Attendance Records</SectionHeader>
              <AttendanceTable data={filteredData} onFacultySelect={onFacultySelect} />
            </div>
          </div>
          <div className="bg-secondary p-6 rounded-xl shadow-lg dark:bg-dark-secondary">
            <SectionHeader>Faculty Attendance Summary</SectionHeader>
            <FacultySummaryTable data={facultySummaryData} onFacultySelect={onFacultySelect} />
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;