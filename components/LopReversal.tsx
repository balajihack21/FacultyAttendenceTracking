import React, { useState, useEffect } from 'react';
import { useLopReversalData, FacultyWithLop } from '../hooks/useLopReversalData';
import { Undo2, Calendar, Briefcase, ChevronDown, ChevronUp, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

const LopReversal: React.FC = () => {
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
    const [monthlyWorkingDays, setMonthlyWorkingDays] = useState<number>(0);
    const { facultyWithLop, loading, error, fetchAndProcessData, reverseLop } = useLopReversalData();
    const [expandedFaculty, setExpandedFaculty] = useState<number | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [isReversing, setIsReversing] = useState<string | null>(null);

    useEffect(() => {
        if (selectedMonth) {
            const [year, month] = selectedMonth.split('-').map(Number);
            const daysInMonth = new Date(year, month, 0).getDate();
            setMonthlyWorkingDays(daysInMonth);
        }
    }, [selectedMonth]);

    const handleFetchData = () => {
        setFeedback(null);
        fetchAndProcessData(selectedMonth, monthlyWorkingDays);
    };

    const handleToggleExpand = (empId: number) => {
        setExpandedFaculty(prev => (prev === empId ? null : empId));
    };

    const handleReverse = async (faculty: FacultyWithLop, date: string) => {
        if (!window.confirm(`Are you sure you want to reverse LOP for ${faculty.name} on ${date}? This will mark them as 'On-time' for that day.`)) {
            return;
        }
        setIsReversing(`${faculty.empId}-${date}`);
        setFeedback(null);
        try {
            await reverseLop(faculty.empId, date);
            setFeedback({ type: 'success', message: `Successfully reversed LOP for ${faculty.name} on ${date}.` });
            fetchAndProcessData(selectedMonth, monthlyWorkingDays);
        } catch (err) {
            setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'An error occurred.' });
        } finally {
            setIsReversing(null);
        }
    };
    
    return (
        <div className="bg-secondary p-8 rounded-lg shadow-xl dark:bg-gray-800">
            <div className="text-center mb-8">
                <Undo2 className="mx-auto h-12 w-12 text-highlight dark:text-teal-300" />
                <h2 className="mt-4 text-2xl font-semibold text-text-primary dark:text-gray-100">LOP Reversal Tool</h2>
                <p className="mt-2 text-text-secondary dark:text-gray-400">
                    Find faculty with Unpaid Leave (LOP) and reverse it by marking an absent day as present.
                </p>
            </div>

            {feedback && (
                <div className={`mb-6 p-4 rounded-md text-sm flex items-start gap-3 ${feedback.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-300'}`}>
                    {feedback.type === 'success' ? <CheckCircle className="h-5 w-5 mt-0.5"/> : <AlertTriangle className="h-5 w-5 mt-0.5"/>}
                    {feedback.message}
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-4 border border-accent dark:border-gray-700 rounded-lg">
                <div className="relative">
                    <label htmlFor="lop-month-select" className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-1">Select Month</label>
                    <Calendar size={18} className="absolute left-3 top-10 text-text-secondary dark:text-gray-400" />
                    <input
                        id="lop-month-select"
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full bg-primary border border-accent rounded-md p-2 pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    />
                </div>
                <div className="relative">
                    <label htmlFor="lop-working-days" className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-1">Monthly Working Days</label>
                    <Briefcase size={18} className="absolute left-3 top-10 text-text-secondary dark:text-gray-400" />
                    <input
                        id="lop-working-days"
                        type="number"
                        value={monthlyWorkingDays}
                        onChange={(e) => setMonthlyWorkingDays(parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-primary border border-accent rounded-md p-2 pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    />
                </div>
                <button
                    onClick={handleFetchData}
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 bg-highlight text-primary font-bold py-2 px-4 rounded-md hover:bg-teal-300 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200 dark:bg-teal-500 dark:hover:bg-teal-400"
                >
                    {loading ? <><Loader2 className="h-5 w-5 animate-spin"/> Fetching...</> : 'Find Faculty with LOP'}
                </button>
            </div>

            <div className="mt-6 space-y-2">
                {error && <p className="text-center text-red-500">{error}</p>}
                {!loading && facultyWithLop.length === 0 && !error && <p className="text-center text-text-secondary dark:text-gray-400">No faculty members found with LOP for the selected criteria.</p>}
                
                {facultyWithLop.map(faculty => (
                    <div key={faculty.empId} className="border border-accent dark:border-gray-700 rounded-lg">
                        <button onClick={() => handleToggleExpand(faculty.empId)} className="w-full flex justify-between items-center p-4 text-left hover:bg-accent dark:hover:bg-gray-700/50">
                            <div>
                                <p className="font-semibold text-text-primary dark:text-gray-200">{faculty.name}</p>
                                <p className="text-sm text-text-secondary dark:text-gray-400">Unpaid Leave Days: <span className="font-bold text-red-500">{faculty.unpaidLeave}</span></p>
                            </div>
                            {expandedFaculty === faculty.empId ? <ChevronUp /> : <ChevronDown />}
                        </button>
                        {expandedFaculty === faculty.empId && (
                            <div className="p-4 border-t border-accent dark:border-gray-700 space-y-2">
                                <h4 className="text-sm font-semibold text-text-secondary dark:text-gray-400">Absent Dates Eligible for Reversal:</h4>
                                {faculty.absentDates.length > 0 ? (
                                    <ul className="list-disc list-inside">
                                        {faculty.absentDates.map(date => (
                                            <li key={date} className="flex justify-between items-center py-1">
                                                <span className="text-text-primary dark:text-gray-300">{date}</span>
                                                <button 
                                                    onClick={() => handleReverse(faculty, date)} 
                                                    disabled={isReversing === `${faculty.empId}-${date}`}
                                                    className="px-3 py-1 text-sm rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400 transition-colors">
                                                    {isReversing === `${faculty.empId}-${date}` ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Reverse'}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-text-secondary dark:text-gray-500 italic">No absent dates found in records.</p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LopReversal;