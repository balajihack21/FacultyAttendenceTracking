import React from 'react';

interface FiltersProps {
  filters: {
    startDate: string;
    endDate: string;
    department: string;
    facultyName: string;
  };
  setters: {
    setStartDateFilter: (date: string) => void;
    setEndDateFilter: (date: string) => void;
    setDepartmentFilter: (dept: string) => void;
    setFacultyNameFilter: (name: string) => void;
  };
  departments: string[];
}

const Filters: React.FC<FiltersProps> = ({ filters, setters, departments }) => {
  const handleDateRangeChange = (range: 'today' | 'week' | 'month' | 'all') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    let start = '';
    let end = todayStr;

    if (range === 'today') {
      start = todayStr;
    } else if (range === 'week') {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      start = weekStart.toISOString().split('T')[0];
    } else if (range === 'month') {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      start = monthStart.toISOString().split('T')[0];
    } else if (range === 'all') {
      start = '';
      end = '';
    }

    setters.setStartDateFilter(start);
    setters.setEndDateFilter(end);
  };

  const getActiveRange = (): 'today' | 'week' | 'month' | 'all' | 'custom' => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (filters.startDate === todayStr && filters.endDate === todayStr) return 'today';

    const today = new Date();
    const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    if (filters.startDate === weekStart.toISOString().split('T')[0]) return 'week';

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    if (filters.startDate === monthStart.toISOString().split('T')[0]) return 'month';

    if (filters.startDate === '' && filters.endDate === '') return 'all';

    return 'custom';
  };

  const activeRange = getActiveRange();

  const DateButton: React.FC<{
    range: 'today' | 'week' | 'month' | 'all';
    children: React.ReactNode;
  }> = ({ range, children }) => {
    const isActive = activeRange === range;
    return (
      <button
        onClick={() => handleDateRangeChange(range)}
        className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors flex-grow text-center ${
          isActive
            ? 'bg-highlight text-white shadow-md'
            : 'text-text-secondary hover:bg-accent dark:text-gray-300 dark:hover:bg-dark-accent/50'
        }`}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
      <div className="md:col-span-1">
        <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2">Date Range</label>
        <div className="flex items-center gap-1 bg-primary p-1 rounded-lg dark:bg-dark-primary/50 border border-accent dark:border-dark-accent">
          <DateButton range="today">Today</DateButton>
          <DateButton range="week">Week</DateButton>
          <DateButton range="month">Month</DateButton>
          <DateButton range="all">All</DateButton>
        </div>
      </div>
      <div>
        <label htmlFor="dept-filter" className="block text-sm font-medium text-text-secondary dark:text-gray-400">Department</label>
        <select
          id="dept-filter"
          value={filters.department}
          onChange={(e) => setters.setDepartmentFilter(e.target.value)}
          className="mt-1 block w-full bg-primary border border-accent rounded-lg shadow-sm py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-highlight focus:border-highlight disabled:bg-accent disabled:cursor-not-allowed dark:bg-dark-secondary dark:border-dark-accent dark:text-gray-200"
        >
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept === 'all' ? 'All Departments' : dept}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="name-filter" className="block text-sm font-medium text-text-secondary dark:text-gray-400">Faculty Name</label>
        <input
          id="name-filter"
          type="text"
          placeholder="Search name..."
          value={filters.facultyName}
          onChange={(e) => setters.setFacultyNameFilter(e.target.value)}
          className="mt-1 block w-full bg-primary border border-accent rounded-lg shadow-sm py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-highlight focus:border-highlight disabled:bg-accent disabled:cursor-not-allowed dark:bg-dark-secondary dark:border-dark-accent dark:text-gray-200"
        />
      </div>
    </div>
  );
};

export default Filters;