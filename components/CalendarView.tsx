
import React from 'react';
import { AttendanceRecord, AttendanceStatus } from '../types';

interface CalendarViewProps {
  attendanceData: AttendanceRecord[];
  month: string; // YYYY-MM
  theme: 'light' | 'dark';
}

const CalendarView: React.FC<CalendarViewProps> = ({ attendanceData, month, theme }) => {
  const [year, monthIndex] = month.split('-').map(Number);
  const monthDate = new Date(year, monthIndex - 1, 1);
  const firstDay = monthDate.getDay(); // 0 for Sunday, 1 for Monday...
  const daysInMonth = new Date(year, monthIndex, 0).getDate();

  const attendanceMap = new Map<number, AttendanceStatus>();
  attendanceData.forEach(record => {
    const day = new Date(record.date).getUTCDate();
    attendanceMap.set(day, record.status);
  });
  
  const getStatusColor = (status: AttendanceStatus) => {
    const lightColors = {
        [AttendanceStatus.OnTime]: 'bg-green-200 border-green-400 text-green-800',
        [AttendanceStatus.Late]: 'bg-red-200 border-red-400 text-red-800',
        [AttendanceStatus.Absent]: 'bg-yellow-200 border-yellow-400 text-yellow-800',
        [AttendanceStatus.OnDuty]: 'bg-blue-200 border-blue-400 text-blue-800',
    };
     const darkColors = {
        [AttendanceStatus.OnTime]: 'bg-green-900/70 border-green-700 text-green-300',
        [AttendanceStatus.Late]: 'bg-red-900/70 border-red-700 text-red-300',
        [AttendanceStatus.Absent]: 'bg-yellow-900/70 border-yellow-700 text-yellow-300',
        [AttendanceStatus.OnDuty]: 'bg-blue-900/70 border-blue-700 text-blue-300',
    };
    return theme === 'light' ? lightColors[status] : darkColors[status];
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-text-secondary dark:text-gray-400 mb-2">
        {weekdays.map(day => <div key={day}>{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="pb-[100%]"></div> // Empty cells for placeholder
        ))}
        {Array.from({ length: daysInMonth }).map((_, day) => {
          const dayNumber = day + 1;
          const status = attendanceMap.get(dayNumber);
          const baseStyle = "w-full rounded-md flex items-center justify-center font-bold text-sm border";
          const noRecordStyle = "bg-primary dark:bg-gray-700/50 border-accent dark:border-gray-600 text-text-secondary dark:text-gray-400";
          
          return (
            <div key={dayNumber} className={`relative pb-[100%] ${status ? getStatusColor(status) : noRecordStyle} ${baseStyle}`}>
                 <div className="absolute inset-0 flex items-center justify-center">
                    {dayNumber}
                 </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
