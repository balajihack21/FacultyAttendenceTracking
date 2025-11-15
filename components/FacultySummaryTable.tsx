import React, { useState, useMemo } from 'react';
import { FacultySummaryRecord } from '../types';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface FacultySummaryTableProps {
  data: FacultySummaryRecord[];
  onFacultySelect: (empId: number) => void;
}

type SortKey = keyof FacultySummaryRecord;

const ROWS_PER_PAGE = 10;

const FacultySummaryTable: React.FC<FacultySummaryTableProps> = ({ data, onFacultySelect }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });

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
            <SortableHeader sortKey="onTime">On-time</SortableHeader>
            <SortableHeader sortKey="late">Late</SortableHeader>
            <SortableHeader sortKey="absent">Absent</SortableHeader>
            <SortableHeader sortKey="totalDays">Total Days</SortableHeader>
          </tr>
        </thead>
        <tbody className="bg-secondary divide-y divide-accent dark:bg-dark-secondary dark:divide-dark-accent">
          {paginatedData.map((record) => (
            <tr key={record.empId} className="hover:bg-accent/50 transition-colors duration-150 dark:hover:bg-dark-accent/50 odd:bg-primary/50 dark:odd:bg-dark-secondary/20">
              <td className="p-3 text-sm text-text-primary dark:text-gray-300">{record.empId}</td>
              <td className="p-3 text-sm text-text-primary whitespace-nowrap dark:text-gray-300">
                <button onClick={() => onFacultySelect(record.empId)} className="text-left hover:underline text-highlight dark:text-teal-400 font-medium">
                  {record.name}
                </button>
              </td>
              <td className="p-3 text-sm text-text-primary dark:text-gray-300">{record.onTime}</td>
              <td className="p-3 text-sm text-text-primary dark:text-gray-300">{record.late}</td>
              <td className="p-3 text-sm text-text-primary dark:text-gray-300">{record.absent}</td>
              <td className="p-3 text-sm text-text-primary font-bold dark:text-gray-100">{record.totalDays}</td>
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

export default FacultySummaryTable;