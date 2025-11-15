import React, { useState, useMemo } from 'react';
import { FacultyRecord } from '../types';
import { Search } from 'lucide-react';
import FacultyLeaveDetails from './FacultyLeaveDetails';

interface AdminLeaveManagementProps {
  facultyList: FacultyRecord[];
}

const AdminLeaveManagement: React.FC<AdminLeaveManagementProps> = ({ facultyList }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyRecord | null>(null);

  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return facultyList
      .filter(f => f.name.toLowerCase().includes(query) || String(f.empId).includes(query))
      .slice(0, 5);
  }, [searchQuery, facultyList]);

  const handleSelectFaculty = (faculty: FacultyRecord) => {
    setSelectedFaculty(faculty);
    setSearchQuery('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="space-y-2 relative">
        <h4 className="font-semibold text-text-primary dark:text-gray-200">
          1. Find Faculty to Manage Leave
        </h4>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary dark:text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Name or Employee ID..."
            className="w-full bg-primary border border-accent rounded-md p-2 pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            disabled={!!selectedFaculty}
          />
        </div>
        {searchResults.length > 0 && searchQuery && (
          <ul className="absolute z-10 w-full mt-1 bg-secondary border border-accent rounded-md shadow-lg max-h-60 overflow-auto dark:bg-gray-800 dark:border-gray-600">
            {searchResults.map(f => (
              <li
                key={f.empId}
                onClick={() => handleSelectFaculty(f)}
                className="p-3 cursor-pointer hover:bg-accent dark:hover:bg-gray-700"
              >
                <p className="font-semibold">{f.name}</p>
                <p className="text-sm text-text-secondary dark:text-gray-400">ID: {f.empId}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedFaculty && (
        <div className="border-t border-accent dark:border-gray-700 pt-6 space-y-4">
          <div className="flex justify-between items-center">
             <h4 className="font-semibold text-text-primary dark:text-gray-200 flex items-center gap-2">
                2. Leave Management for {selectedFaculty.name}
            </h4>
            <button
                onClick={() => setSelectedFaculty(null)}
                className="text-sm text-highlight hover:underline dark:text-teal-300"
            >
                Change Faculty
            </button>
          </div>
          <FacultyLeaveDetails faculty={selectedFaculty} />
        </div>
      )}
    </div>
  );
};

export default AdminLeaveManagement;
