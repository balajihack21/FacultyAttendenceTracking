
import React, { useState, useMemo } from 'react';
import { useFacultyData } from '../hooks/useFacultyData';
import FacultyTable from './FacultyTable';
import FacultyFileUpload from './FacultyFileUpload';
import EditFacultyForm from './EditFacultyForm';
import ManualAttendance from './ManualAttendance';
import AdminLeaveManagement from './AdminLeaveManagement';
import { UserPlus, UploadCloud, Edit, List, ClipboardCheck, AlertTriangle, CalendarPlus } from 'lucide-react';
import { FacultyRecord } from '../types';

interface FacultyPageProps {
  theme: 'light' | 'dark';
  onFacultySelect: (empId: number) => void;
}

const FacultyPage: React.FC<FacultyPageProps> = ({ theme, onFacultySelect }) => {
  const { facultyList, loading, error, addFaculty, handleFileUpload, updateFaculty, deleteFaculty, clearError } = useFacultyData();
  const [activeTab, setActiveTab] = useState<'view' | 'add' | 'upload' | 'edit' | 'manual' | 'leave'>('view');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  
  const [newFaculty, setNewFaculty] = useState({
      empId: '', name: '', dept: '', designation: '', salary: '', casualLeaves: ''
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [facultyToDelete, setFacultyToDelete] = useState<FacultyRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const departments = useMemo(() => {
    const depts = new Set(facultyList.map(f => f.dept));
    return ['all', ...Array.from(depts)];
  }, [facultyList]);
  
  const filteredFaculty = useMemo(() => {
    if (departmentFilter === 'all') {
        return facultyList;
    }
    return facultyList.filter(f => f.dept === departmentFilter);
  }, [facultyList, departmentFilter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewFaculty(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFaculty.empId && newFaculty.name && newFaculty.dept && newFaculty.designation && newFaculty.salary) {
      addFaculty({
        empId: parseInt(newFaculty.empId, 10),
        name: newFaculty.name,
        dept: newFaculty.dept,
        designation: newFaculty.designation,
        salary: parseFloat(newFaculty.salary),
        casualLeaves: parseInt(newFaculty.casualLeaves, 10) || 0,
      });
      setNewFaculty({ empId: '', name: '', dept: '', designation: '', salary: '', casualLeaves: '' }); // Reset form
    } else {
        alert("Please fill all fields");
    }
  };

  const handleDeleteRequest = (faculty: FacultyRecord) => {
    setFacultyToDelete(faculty);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (facultyToDelete) {
      setIsDeleting(true);
      try {
        await deleteFaculty(facultyToDelete.empId);
        setIsDeleteModalOpen(false);
        setFacultyToDelete(null);
      } catch (e) {
        console.error("Deletion failed", e);
        // Error is set in the hook and will be displayed at the top.
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const TabButton: React.FC<{
    tabName: typeof activeTab;
    children: React.ReactNode;
  }> = ({ tabName, children }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        activeTab === tabName
          ? 'bg-highlight text-primary dark:bg-teal-500 dark:text-gray-100'
          : 'text-text-secondary hover:bg-accent hover:text-text-primary dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
      }`}
    >
      {children}
    </button>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'view':
        return (
          <div>
            <div className="mb-4">
              <label htmlFor="dept-filter-faculty" className="block text-sm font-medium text-text-secondary dark:text-gray-400">Filter by Department</label>
              <select
                id="dept-filter-faculty"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="mt-1 block w-full max-w-xs bg-primary border border-accent rounded-lg shadow-sm py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-highlight focus:border-highlight dark:bg-dark-secondary dark:border-dark-accent dark:text-gray-200"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept === 'all' ? 'All Departments' : dept}</option>
                ))}
              </select>
            </div>
            <FacultyTable data={filteredFaculty} onFacultySelect={onFacultySelect} onDeleteRequest={handleDeleteRequest} />
          </div>
        );
      case 'add':
        return (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
            <input type="number" name="empId" value={newFaculty.empId} onChange={handleInputChange} placeholder="Employee ID" required className="w-full bg-primary border border-accent rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
            <input type="text" name="name" value={newFaculty.name} onChange={handleInputChange} placeholder="Name" required className="w-full bg-primary border border-accent rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
            <input type="text" name="dept" value={newFaculty.dept} onChange={handleInputChange} placeholder="Department" required className="w-full bg-primary border border-accent rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
            <input type="text" name="designation" value={newFaculty.designation} onChange={handleInputChange} placeholder="Designation" required className="w-full bg-primary border border-accent rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
            <input type="number" name="salary" value={newFaculty.salary} onChange={handleInputChange} placeholder="Salary" required className="w-full bg-primary border border-accent rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
            <input type="number" name="casualLeaves" value={newFaculty.casualLeaves} onChange={handleInputChange} placeholder="Casual Leaves" required className="w-full bg-primary border border-accent rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
            <button type="submit" disabled={loading} className="w-full bg-highlight text-primary font-bold py-2 px-4 rounded-md hover:bg-teal-300 disabled:bg-gray-500 dark:bg-teal-500 dark:hover:bg-teal-400">
                {loading ? 'Adding...' : 'Add Faculty'}
            </button>
          </form>
        );
      case 'upload':
        return (
          <div className="max-w-md mx-auto">
             <p className="text-sm text-center text-text-secondary dark:text-gray-400 mb-4">Upload an Excel file with columns: empId, name, dept, designation, salary, casualLeaves.</p>
             <FacultyFileUpload onFileUpload={handleFileUpload} />
          </div>
        );
      case 'edit':
        return (
            <div className="max-w-md mx-auto">
                <EditFacultyForm facultyList={facultyList} updateFaculty={updateFaculty} loading={loading} />
            </div>
        );
      case 'manual':
        return <ManualAttendance />;
      case 'leave':
        return <AdminLeaveManagement facultyList={facultyList} />;
      default:
        return null;
    }
  };

  const tabTitles = {
    view: 'All Faculty',
    add: 'Add New Faculty',
    upload: 'Bulk Upload from Excel',
    edit: 'Edit Faculty Details',
    manual: 'Manual Attendance Marking',
    leave: 'Leave Management'
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded-lg relative flex items-center dark:bg-red-900/50 dark:border-red-700 dark:text-red-300" role="alert">
          <strong className="font-bold mr-2">Error:</strong>
          <span className="block sm:inline">{error}</span>
          <button onClick={clearError} className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}

      <div className="bg-secondary p-6 rounded-lg shadow-xl dark:bg-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-highlight dark:text-teal-300">{tabTitles[activeTab]}</h2>
            <nav className="flex flex-wrap items-center gap-2">
                <TabButton tabName="view"><List size={16} /> View All</TabButton>
                <TabButton tabName="add"><UserPlus size={16} /> Add New</TabButton>
                <TabButton tabName="upload"><UploadCloud size={16} /> Bulk Upload</TabButton>
                <TabButton tabName="edit"><Edit size={16} /> Edit Details</TabButton>
                <TabButton tabName="manual"><ClipboardCheck size={16} /> Manual Attendance</TabButton>
                <TabButton tabName="leave"><CalendarPlus size={16} /> Leave Management</TabButton>
            </nav>
        </div>
        <div className="relative">
            {loading && activeTab !== 'edit' && activeTab !== 'manual' && activeTab !== 'leave' && (
                <div className="absolute inset-0 bg-primary/50 dark:bg-gray-900/50 flex items-center justify-center z-10 rounded-lg">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-highlight dark:border-teal-300"></div>
                </div>
            )}
            {renderContent()}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && facultyToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-secondary dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                </div>
                <div className="mt-0 text-center sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-text-primary dark:text-gray-100" id="modal-title">
                    Delete Faculty Member
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-text-secondary dark:text-gray-400">
                      Are you sure you want to delete <strong className="dark:text-gray-200">{facultyToDelete.name}</strong> (ID: {facultyToDelete.empId})?
                      This action will also remove all associated attendance records and cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-accent dark:bg-gray-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
              <button
                type="button"
                disabled={isDeleting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-500"
                onClick={handleConfirmDelete}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyPage;
