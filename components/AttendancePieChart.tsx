import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartData, AttendanceStatus } from '../types';

interface AttendancePieChartProps {
  data: ChartData[];
  theme: 'light' | 'dark';
}

const COLORS = {
    [AttendanceStatus.OnTime]: '#38b2ac', // Teal
    [AttendanceStatus.Late]: '#e53e3e', // Red
    [AttendanceStatus.Absent]: '#d69e2e', // Yellow/Gold
    [AttendanceStatus.OnDuty]: '#4299e1', // Blue
};

const AttendancePieChart: React.FC<AttendancePieChartProps> = ({ data, theme }) => {
    if (!data || data.every(d => d.value === 0)) {
        return <div className="flex items-center justify-center h-full text-text-secondary dark:text-gray-400">No data for this selection</div>;
    }

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
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ top: 0, right: 0, bottom: 25, left: 0 }}>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          labelLine={false}
          outerRadius={90}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
              const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
              const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
              const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
              return (
                  <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                      {`${(percent * 100).toFixed(0)}%`}
                  </text>
              );
          }}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.name as AttendanceStatus]} />
          ))}
        </Pie>
        <Tooltip
            contentStyle={tooltipStyle}
            itemStyle={theme === 'light' ? { color: '#2d3748' } : { color: '#f7fafc' }}
        />
        <Legend iconSize={12} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default AttendancePieChart;