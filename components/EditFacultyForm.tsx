import React, { useState, useMemo } from 'react';
import { FacultyRecord } from '../types';
import { Search, Edit } from 'lucide-react';

interface EditFacultyFormProps {
  facultyList: FacultyRecord[];
  updateFaculty: (empId: number, data: Omit<FacultyRecord, 'empId'>) => Promise<void>;
  loading: boolean;
}

const EditFacultyForm: React.FC<EditFacultyFormProps> = ({ facultyList, updateFaculty, loading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBy, setSearchBy] = useState<'empId' | 'name'>('name');
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyRecord | null>(null);
  const [editFormState, setEditFormState] = useState<Omit<FacultyRecord, 'empId'>>({ name: '', dept: '', designation: '', salary: 0, casualLeaves: 0 });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return facultyList.filter(f => {
      if (searchBy === 'empId') {
        return String(f.empId).includes(query);
      }
      return f.name.toLowerCase().includes(query);
    }).slice(0, 5); // Limit results to 5
  }, [searchQuery, searchBy, facultyList]);

  const handleSelectFaculty = (faculty: FacultyRecord) => {
    setSelectedFaculty(faculty);
    setEditFormState({
      name: faculty.name,
      dept: faculty.dept,
      designation: faculty.designation,
      salary: faculty.salary,
      casualLeaves: faculty.casualLeaves,
    });
    setSearchQuery('');
    setFeedback(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const isNumberField = name === 'salary' || name === 'casualLeaves';
    setEditFormState(prev => ({ ...prev, [name]: isNumberField ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaculty) return;
    setFeedback(null);
    try {
      await updateFaculty(selectedFaculty.empId, editFormState);
      setFeedback({ type: 'success', message: `Successfully updated details for ${selectedFaculty.name}.` });
      setSelectedFaculty(null); // Clear form after successful update
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to update details. Please try again.' });
    }
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div className={`p-4 rounded-md text-sm ${feedback.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-300'}`}>
          {feedback.message}
        </div>
      )}

      {/* Search Section */}
      <div className="space-y-2 relative">
        <h4 className="font-semibold text-text-primary dark:text-gray-200">1. Find Faculty to Edit</h4>
        <div className="flex gap-2">
          <select value={searchBy} onChange={e => setSearchBy(e.target.value as 'empId' | 'name')} className="bg-primary border border-accent rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:ring-highlight focus:border-highlight">
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
              className="w-full bg-primary border border-accent rounded-md p-2 pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            />
          </div>
        </div>
        {searchResults.length > 0 && searchQuery && (
          <ul className="absolute z-10 w-full mt-1 bg-secondary border border-accent rounded-md shadow-lg max-h-60 overflow-auto dark:bg-gray-800 dark:border-gray-600">
            {searchResults.map(f => (
              <li
                key={f.empId}
                onClick={() => handleSelectFaculty(f)}
                className="p-2 cursor-pointer hover:bg-accent dark:hover:bg-gray-700"
              >
                {f.name} ({f.empId})
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Edit Form Section */}
      {selectedFaculty && (
        <div className="border-t border-accent dark:border-gray-700 pt-6 space-y-4">
            <h4 className="font-semibold text-text-primary dark:text-gray-200 flex items-center gap-2">
                <Edit size={20} />
                2. Editing Details for {selectedFaculty.name}
            </h4>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-text-secondary dark:text-gray-400">Employee ID</label>
                    <input type="text" value={selectedFaculty.empId} readOnly className="w-full bg-accent border border-accent rounded-md p-2 mt-1 dark:bg-gray-900/50 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed" />
                </div>
                <div>
                    <label className="text-sm font-medium text-text-secondary dark:text-gray-400">Name</label>
                    <input type="text" name="name" value={editFormState.name} onChange={handleInputChange} required className="w-full bg-primary border border-accent rounded-md p-2 mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                </div>
                <div>
                    <label className="text-sm font-medium text-text-secondary dark:text-gray-400">Department</label>
                    <input type="text" name="dept" value={editFormState.dept} onChange={handleInputChange} required className="w-full bg-primary border border-accent rounded-md p-2 mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                </div>
                <div>
                    <label className="text-sm font-medium text-text-secondary dark:text-gray-400">Designation</label>
                    <input type="text" name="designation" value={editFormState.designation} onChange={handleInputChange} required className="w-full bg-primary border border-accent rounded-md p-2 mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                </div>
                <div>
                    <label className="text-sm font-medium text-text-secondary dark:text-gray-400">Salary</label>
                    <input type="number" name="salary" value={editFormState.salary} onChange={handleInputChange} required className="w-full bg-primary border border-accent rounded-md p-2 mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                </div>
                <div>
                    <label className="text-sm font-medium text-text-secondary dark:text-gray-400">Casual Leaves</label>
                    <input type="number" name="casualLeaves" value={editFormState.casualLeaves} onChange={handleInputChange} required className="w-full bg-primary border border-accent rounded-md p-2 mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-highlight text-primary font-bold py-2 px-4 rounded-md hover:bg-teal-300 disabled:bg-gray-500 dark:bg-teal-500 dark:hover:bg-teal-400">
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
      )}
    </div>
  );
};

export default EditFacultyForm;