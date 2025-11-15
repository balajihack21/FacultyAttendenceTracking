

import React, { useState, useMemo } from 'react';
import { MonthlySummary } from '../types';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface SummaryTableProps {
  data: MonthlySummary[];
  onPayableDaysChange: (empId: number, newPayableDays: number) => void;
  onFacultySelect: (empId: number) => void;
}

type SortKey = keyof MonthlySummary;

const ROWS_PER_PAGE = 10;

const SummaryTable: React.FC<SummaryTableProps> = ({ data, onPayableDaysChange, onFacultySelect }) => {
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
    <th className="p-3 text-left font-semibold text-text-secondary tracking-wider dark:text-gray-400">
      <button onClick={() => requestSort(sortKey)} className="flex items-center gap-2 hover:text-text-primary dark:hover:text-gray-200">
        {children}
        <ArrowUpDown size={14} />
      </button>
    </th>
  );
  
  if (data.length === 0) {
      return <div className="text-center py-10 text-text-secondary dark:text-gray-400">No summary data to display. Adjust filters or upload data.</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-accent dark:divide-gray-700">
        <thead className="bg-primary dark:bg-gray-900">
          <tr>
            <SortableHeader sortKey="empId">Emp. ID</SortableHeader>
            <SortableHeader sortKey="name">Name</SortableHeader>
            <SortableHeader sortKey="presentDays">Present</SortableHeader>
            <SortableHeader sortKey="casualLeavesAvailable">CL Avail.</SortableHeader>
            <SortableHeader sortKey="casualLeavesUsed">CL Used</SortableHeader>
            <SortableHeader sortKey="unpaidLeave">Unpaid</SortableHeader>
            <SortableHeader sortKey="totalLeaves">Total Leaves</SortableHeader>
            <SortableHeader sortKey="payableDays">Payable Days</SortableHeader>
            <SortableHeader sortKey="calculatedSalary">Calculated Salary</SortableHeader>
          </tr>
        </thead>
        <tbody className="bg-secondary divide-y divide-accent dark:bg-gray-800 dark:divide-gray-700">
          {paginatedData.map((record) => (
            <tr key={record.empId} className="hover:bg-accent transition-colors duration-150 dark:hover:bg-gray-700">
              <td className="p-3 text-sm text-text-primary dark:text-gray-300">{record.empId}</td>
              <td className="p-3 text-sm text-text-primary whitespace-nowrap dark:text-gray-300">
                <button onClick={() => onFacultySelect(record.empId)} className="text-left hover:underline text-highlight dark:text-teal-300">
                  {record.name}
                </button>
              </td>
              <td className="p-3 text-sm text-center text-text-primary dark:text-gray-300">{record.presentDays}</td>
              <td className="p-3 text-sm text-center text-text-primary dark:text-gray-300">{record.casualLeavesAvailable}</td>
              <td className="p-3 text-sm text-center text-text-primary dark:text-gray-300">{record.casualLeavesUsed}</td>
              <td className="p-3 text-sm text-center text-text-primary dark:text-gray-300">{record.unpaidLeave}</td>
              <td className="p-3 text-sm text-center text-text-primary dark:text-gray-300">{record.totalLeaves.toFixed(1)}</td>
              <td className="p-3 text-sm text-text-primary dark:text-gray-300">
                <input
                    type="number"
                    defaultValue={record.payableDays.toFixed(1)}
                    onBlur={(e) => onPayableDaysChange(record.empId, parseFloat(e.target.value))}
                    className="w-24 bg-primary border border-accent rounded-md shadow-sm p-1 text-center text-text-primary focus:outline-none focus:ring-highlight focus:border-highlight dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
              </td>
              <td className="p-3 text-sm text-text-primary font-semibold whitespace-nowrap dark:text-gray-100">{record.calculatedSalary.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between mt-4 text-sm text-text-secondary dark:text-gray-400">
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
            <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-gray-700"
            >
                <ChevronLeft size={16}/>
            </button>
            <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-gray-700"
            >
                <ChevronRight size={16}/>
            </button>
        </div>
      </div>
    </div>
  );
};

export default SummaryTable;