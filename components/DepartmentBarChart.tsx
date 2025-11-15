import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DepartmentChartData, AttendanceStatus } from '../types';

interface DepartmentBarChartProps {
  data: DepartmentChartData[];
  theme: 'light' | 'dark';
}

const DepartmentBarChart: React.FC<DepartmentBarChartProps> = ({ data, theme }) => {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-text-secondary dark:text-gray-400">No data for this selection</div>;
    }

    const gridColor = theme === 'light' ? '#e2e8f0' : '#4a5568';
    const axisColor = theme === 'light' ? '#718096' : '#a0aec0';
    const tooltipCursorColor = theme === 'light' ? 'rgba(226, 232, 240, 0.8)' : 'rgba(74, 85, 104, 0.8)';
    const tooltipStyle = theme === 'light'
      ? {
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          color: '#2d3748'
        }
      : {
          backgroundColor: '#2d3748',
          border: '1px solid #4a5568',
          borderRadius: '0.5rem',
          color: '#f7fafc'
        };

  return (
    <ResponsiveContainer width="100%" height="90%">
      <BarChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="name" stroke={axisColor} />
        <YAxis stroke={axisColor} />
        <Tooltip
            contentStyle={tooltipStyle}
            itemStyle={theme === 'light' ? { color: '#2d3748' } : { color: '#f7fafc' }}
            cursor={{fill: tooltipCursorColor}}
        />
        <Legend verticalAlign="top" iconSize={12} iconType="circle"/>
        <Bar dataKey={AttendanceStatus.OnTime} fill="#38b2ac" name="On-time" />
        <Bar dataKey={AttendanceStatus.Late} fill="#e53e3e" name="Late"/>
        <Bar dataKey={AttendanceStatus.Absent} fill="#d69e2e" name="Absent"/>
        <Bar dataKey={AttendanceStatus.OnDuty} fill="#4299e1" name="On-Duty"/>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default DepartmentBarChart;