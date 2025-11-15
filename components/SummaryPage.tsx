

import React, { useState, useMemo } from 'react';
import { useSummaryData } from '../hooks/useSummaryData';
import SummaryTable from './SummaryTable';
import { generateSummaryPDF, generateBriefSummaryPDF } from '../utils/pdfGenerator';
import { generateSummaryCSV } from '../utils/csvGenerator';
import { FileDown, Calendar, Briefcase, FileSpreadsheet, AlertTriangle, CheckCircle, FileText, Loader2 } from 'lucide-react';

interface SummaryPageProps {
  onFacultySelect: (empId: number) => void;
}

const SummaryPage: React.FC<SummaryPageProps> = ({ onFacultySelect }) => {
    // FIX: Destructure `updatePayableDays` from the hook to pass it to the SummaryTable.
    const {
        summaryData,
        loading,
        error,
        clearError,
        selectedMonth,
        setSelectedMonth,
        monthlyWorkingDays,
        setMonthlyWorkingDays,
        finalizeAndDeductCLs,
        updatePayableDays,
        isAllocationRun,
        isCheckingAllocation,
    } = useSummaryData();

    const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [finalizeFeedback, setFinalizeFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const monthYearDisplay = useMemo(() => {
        if (!selectedMonth) return '';
        const [year, month] = selectedMonth.split('-');
        const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 2);
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    }, [selectedMonth]);

    const handlePdfExport = () => {
        if (summaryData.length > 0) {
            generateSummaryPDF(summaryData, selectedMonth, monthlyWorkingDays);
        } else {
            alert("No data available to export.");
        }
    };

    const handleBriefPdfExport = () => {
        if (summaryData.length > 0) {
            generateBriefSummaryPDF(summaryData, selectedMonth, monthlyWorkingDays);
        } else {
            alert("No data available to export.");
        }
    };

    const handleCsvExport = () => {
        if (summaryData.length > 0) {
            generateSummaryCSV(summaryData, selectedMonth);
        } else {
            alert("No data available to export.");
        }
    };
    
    const handleFinalize = async () => {
        setIsFinalizing(true);
        setFinalizeFeedback(null);
        try {
            const message = await finalizeAndDeductCLs();
            setFinalizeFeedback({ type: 'success', message });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
            setFinalizeFeedback({ type: 'error', message: `Finalization failed: ${errorMessage}` });
        } finally {
            setIsFinalizing(false);
            setIsFinalizeModalOpen(false);
        }
    }
    
    return (
        <div className="space-y-8">
            {loading && !isFinalizing && (
                <div className="fixed inset-0 bg-primary/80 dark:bg-gray-900/80 flex items-center justify-center z-50">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-highlight dark:border-teal-300"></div>
                        <p className="text-text-secondary dark:text-gray-400 text-lg">Calculating Summaries...</p>
                    </div>
                </div>
            )}
             {error && (
                <div className="bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded-lg relative flex items-center dark:bg-red-900/50 dark:border-red-700 dark:text-red-300" role="alert">
                    <strong className="font-bold mr-2">Error:</strong>
                    <span className="block sm:inline">{error}</span>
                    <button onClick={clearError} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>
            )}
            
            {finalizeFeedback && (
                <div className={`p-4 rounded-lg flex items-start gap-3 ${finalizeFeedback.type === 'success' ? 'bg-green-100 dark:bg-green-900/50 border-green-400 dark:border-green-700' : 'bg-red-100 dark:bg-red-900/50 border-red-400 dark:border-red-700'}`}>
                    {finalizeFeedback.type === 'success' ? <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" /> : <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />}
                    <div className="flex-1">
                        <p className={`font-semibold ${finalizeFeedback.type === 'success' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                            {finalizeFeedback.type === 'success' ? 'Success' : 'Error'}
                        </p>
                        <p className={`text-sm ${finalizeFeedback.type === 'success' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                            {finalizeFeedback.message}
                        </p>
                    </div>
                     <button onClick={() => setFinalizeFeedback(null)} className="text-2xl">&times;</button>
                </div>
            )}
            
            {!loading && !error && (
                isCheckingAllocation ? (
                    <div className="p-4 rounded-lg flex items-center gap-3 bg-blue-100 dark:bg-blue-900/50">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                            Checking monthly allocation status for {monthYearDisplay}...
                        </p>
                    </div>
                ) : isAllocationRun ? (
                    <div className="p-4 rounded-lg flex items-start gap-3 bg-green-100 dark:bg-green-900/50 border-green-400 dark:border-green-700">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-green-800 dark:text-green-300">Allocation Complete</p>
                            <p className="text-sm text-green-700 dark:text-green-400">
                                The monthly Casual Leave (CL) allocation has been successfully run for <strong>{monthYearDisplay}</strong>. You may proceed with finalizing the month.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 rounded-lg flex items-start gap-3 bg-yellow-100 dark:bg-yellow-900/50 border-yellow-400 dark:border-yellow-700">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-yellow-800 dark:text-yellow-300">Action Required</p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                The monthly CL allocation has not been run for <strong>{monthYearDisplay}</strong>. Please go to <strong>Settings &gt; Monthly Actions</strong> to run the allocation before finalizing.
                            </p>
                        </div>
                    </div>
                )
            )}

            <div className="bg-secondary p-6 rounded-lg shadow-xl dark:bg-gray-800">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                        <h2 className="text-xl font-semibold text-highlight dark:text-teal-300">Monthly Attendance & Salary Summary</h2>
                        <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">Review monthly data and finalize to deduct used Casual Leaves from faculty balances.</p>
                    </div>
                     <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0">
                        <button
                            onClick={handleBriefPdfExport}
                            disabled={summaryData.length === 0}
                            className="w-full sm:w-auto bg-blue-600 text-primary font-bold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2 dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                            <FileText size={18} />
                            Generate Brief PDF
                        </button>
                        <button
                            onClick={handleCsvExport}
                            disabled={summaryData.length === 0}
                            className="w-full sm:w-auto bg-green-600 text-primary font-bold py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2 dark:bg-green-500 dark:hover:bg-green-600"
                        >
                            <FileSpreadsheet size={18} />
                            Export to Excel
                        </button>
                        <button
                            onClick={handlePdfExport}
                            disabled={summaryData.length === 0}
                            className="w-full sm:w-auto bg-highlight text-primary font-bold py-2 px-4 rounded-md hover:bg-teal-300 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2 dark:bg-teal-500 dark:hover:bg-teal-400"
                        >
                            <FileDown size={18} />
                            Generate PDF Report
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 border-t border-accent dark:border-gray-700 pt-6 items-end">
                    <div className="relative">
                        <label htmlFor="month-select" className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-1">Select Month</label>
                        <Calendar size={18} className="absolute left-3 top-10 text-text-secondary dark:text-gray-400" />
                        <input
                            id="month-select"
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full bg-primary border border-accent rounded-md p-2 pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                        />
                    </div>
                     <div className="relative">
                        <label htmlFor="working-days" className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-1">Monthly Working Days</label>
                         <Briefcase size={18} className="absolute left-3 top-10 text-text-secondary dark:text-gray-400" />
                        <input
                            id="working-days"
                            type="number"
                            value={monthlyWorkingDays}
                            onChange={(e) => setMonthlyWorkingDays(parseInt(e.target.value, 10) || 0)}
                             className="w-full bg-primary border border-accent rounded-md p-2 pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <button
                            onClick={() => setIsFinalizeModalOpen(true)}
                            disabled={summaryData.length === 0 || monthlyWorkingDays <= 0 || !isAllocationRun || isCheckingAllocation}
                            className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={18} />
                            Finalize Month & Deduct CLs
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-secondary p-6 rounded-lg shadow-xl dark:bg-gray-800">
                <SummaryTable data={summaryData} onPayableDaysChange={updatePayableDays} onFacultySelect={onFacultySelect} />
            </div>

            {isFinalizeModalOpen && (
                 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-secondary dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                                </div>
                                <div className="mt-0 text-center sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-text-primary dark:text-gray-100">
                                    Finalize Month
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-text-secondary dark:text-gray-400">
                                    You are about to finalize the summary for <strong className="dark:text-gray-200">{monthYearDisplay}</strong>. This will permanently deduct the 'CL Used' from each faculty member's CL balance. This action cannot be undone.
                                    </p>
                                </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-accent dark:bg-gray-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                        <button
                            type="button"
                            disabled={isFinalizing}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-500"
                            onClick={handleFinalize}
                        >
                            {isFinalizing ? 'Finalizing...' : 'Confirm & Finalize'}
                        </button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500"
                            onClick={() => setIsFinalizeModalOpen(false)}
                        >
                            Cancel
                        </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SummaryPage;