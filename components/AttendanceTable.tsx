import React, { useState, useMemo } from 'react';
import { AttendanceRecord, AttendanceStatus } from '../types';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface AttendanceTableProps {
  data: AttendanceRecord[];
  onFacultySelect: (empId: number) => void;
}

type SortKey = keyof AttendanceRecord;

const ROWS_PER_PAGE = 10;

const AttendanceTable: React.FC<AttendanceTableProps> = ({ data, onFacultySelect }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

  const sortedData = useMemo(() => {
    let sortableData = [...data];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / ROWS_PER_PAGE);
  const paginatedData = sortedData.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const SortableHeader: React.FC<{ sortKey: SortKey, children: React.ReactNode }> = ({ sortKey, children }) => (
    <th className="p-3 text-left text-sm font-semibold text-text-secondary tracking-wider dark:text-gray-400">
      <button onClick={() => requestSort(sortKey)} className="flex items-center gap-2 hover:text-text-primary dark:hover:text-gray-200 transition-colors">
        {children}
        <ArrowUpDown size={14} />
      </button>
    </th>
  );
  
  if (data.length === 0) {
      return <div className="text-center py-10 text-text-secondary dark:text-gray-400">No matching records found.</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-accent dark:divide-dark-accent">
        <thead className="bg-primary/80 dark:bg-dark-secondary/50">
          <tr>
            <SortableHeader sortKey="empId">Emp. ID</SortableHeader>
            <SortableHeader sortKey="name">Name</SortableHeader>
            <SortableHeader sortKey="dept">Department</SortableHeader>
            <SortableHeader sortKey="date">Date</SortableHeader>
            <SortableHeader sortKey="inTime">In Time</SortableHeader>
            <SortableHeader sortKey="status">Status</SortableHeader>
          </tr>
        </thead>
        <tbody className="bg-secondary divide-y divide-accent dark:bg-dark-secondary dark:divide-dark-accent">
          {paginatedData.map((record) => (
            <tr key={record.id} className="hover:bg-accent/50 transition-colors duration-150 dark:hover:bg-dark-accent/50 odd:bg-primary/50 dark:odd:bg-dark-secondary/20">
              <td className="p-3 text-sm text-text-primary dark:text-gray-300">{record.empId}</td>
              <td className="p-3 text-sm text-text-primary whitespace-nowrap dark:text-gray-300">
                <button onClick={() => onFacultySelect(record.empId)} className="text-left hover:underline text-highlight dark:text-teal-400 font-medium">
                  {record.name}
                </button>
              </td>
              <td className="p-3 text-sm text-text-primary dark:text-gray-300">{record.dept}</td>
              <td className="p-3 text-sm text-text-primary dark:text-gray-300">{record.date}</td>
              <td className="p-3 text-sm text-text-primary dark:text-gray-300">{record.status === AttendanceStatus.Absent ? 'No Punch' : record.status === AttendanceStatus.OnDuty ? 'N/A' : record.inTime}</td>
              <td className="p-3 text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  record.status === AttendanceStatus.OnTime
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-300'
                    : record.status === AttendanceStatus.Late
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-300'
                    : record.status === AttendanceStatus.OnDuty
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-300'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/70 dark:text-yellow-300'
                }`}>
                  {record.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between mt-4 text-sm text-text-secondary dark:text-gray-400">
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
            <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-dark-accent"
            >
                <ChevronLeft size={16}/>
            </button>
            <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-dark-accent"
            >
                <ChevronRight size={16}/>
            </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTable;