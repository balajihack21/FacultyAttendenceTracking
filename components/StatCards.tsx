import React from 'react';
import { Users, Clock, AlertTriangle, UserX, ClipboardCheck } from 'lucide-react';

interface StatCardsProps {
  stats: {
    total: number;
    onTime: number;
    late: number;
    absent: number;
    onDuty: number;
  };
}

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; colorClass: string }> = ({ title, value, icon, colorClass }) => {
    return (
        <div className={`bg-secondary p-5 rounded-xl shadow-lg dark:bg-dark-secondary border-t-4 ${colorClass} transition-transform transform hover:-translate-y-1`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm text-text-secondary font-medium dark:text-slate-400">{title}</p>
                    <p className="text-3xl font-bold text-text-primary dark:text-slate-100 mt-1">{value}</p>
                </div>
                <div className="p-2">
                    {icon}
                </div>
            </div>
        </div>
    );
};


const StatCards: React.FC<StatCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <StatCard title="Total Faculty" value={stats.total} icon={<Users className="h-7 w-7 text-indigo-500"/>} colorClass="border-indigo-500"/>
        <StatCard title="On-time" value={stats.onTime} icon={<Clock className="h-7 w-7 text-green-500"/>} colorClass="border-green-500"/>
        <StatCard title="Late" value={stats.late} icon={<AlertTriangle className="h-7 w-7 text-red-500"/>} colorClass="border-red-500"/>
        <StatCard title="Absent" value={stats.absent} icon={<UserX className="h-7 w-7 text-yellow-500"/>} colorClass="border-yellow-500"/>
        <StatCard title="On-Duty" value={stats.onDuty} icon={<ClipboardCheck className="h-7 w-7 text-sky-500"/>} colorClass="border-sky-500"/>
    </div>
  );
};

export default StatCards;