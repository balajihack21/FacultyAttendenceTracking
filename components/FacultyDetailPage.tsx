import React, { useState } from 'react';
import { useFacultyDetailData } from '../hooks/useFacultyDetailData';
import { ArrowLeft, Loader2, User, Briefcase, Building, Clock, AlertTriangle, UserX, ClipboardCheck, Calendar as CalendarIcon, CalendarCheck, FileText, ChevronRight, X, FileDown, Trash2, CheckCircle, XCircle, ChevronDown, ChevronUp, Inbox } from 'lucide-react';
import CalendarView from './CalendarView';
import { AttendanceRecord, AttendanceStatus, LeaveApplicationRecord, LeaveStatus } from '../types';
import LeaveManagement from './LeaveManagement';
import { generateLeaveApplicationPDF, LeaveApplicationDetails } from '../utils/pdfGenerator';

interface FacultyDetailPageProps {
  empId: number;
  onBack: () => void;
  theme: 'light' | 'dark';
}

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; }> = ({ title, value, icon }) => {
    return (
        <div className="bg-secondary p-4 rounded-lg shadow-lg flex items-center space-x-3 dark:bg-slate-800">
            {icon}
            <div>
                <p className="text-sm text-text-secondary font-medium dark:text-slate-400">{title}</p>
                <p className="text-xl font-bold text-text-primary dark:text-slate-100">{value}</p>
            </div>
        </div>
    );
};

const DetailRecordTable: React.FC<{ data: AttendanceRecord[] }> = ({ data }) => {
    if (data.length === 0) {
        return <div className="text-center py-10 text-text-secondary dark:text-slate-400">No records for this month.</div>
    }

    return (
        <div className="overflow-x-auto max-h-96">
            <table className="min-w-full divide-y divide-accent dark:divide-slate-700">
                <thead className="bg-primary dark:bg-slate-900 sticky top-0">
                    <tr>
                        <th className="p-3 text-left font-semibold text-text-secondary tracking-wider dark:text-slate-400">Date</th>
                        <th className="p-3 text-left font-semibold text-text-secondary tracking-wider dark:text-slate-400">In Time</th>
                        <th className="p-3 text-left font-semibold text-text-secondary tracking-wider dark:text-slate-400">Status</th>
                    </tr>
                </thead>
                <tbody className="bg-secondary divide-y divide-accent dark:bg-slate-800 dark:divide-slate-700">
                {data.map((record) => (
                    <tr key={record.id} className="hover:bg-accent transition-colors duration-150 dark:hover:bg-slate-700">
                        <td className="p-3 text-sm text-text-primary dark:text-slate-300">{record.date}</td>
                        <td className="p-3 text-sm text-text-primary dark:text-slate-300">{record.status === AttendanceStatus.Absent ? 'No Punch' : record.status === AttendanceStatus.OnDuty ? 'N/A' : record.inTime}</td>
                        <td className="p-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            record.status === AttendanceStatus.OnTime ? 'bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-300'
                            : record.status === AttendanceStatus.Late ? 'bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-300'
                            : record.status === AttendanceStatus.OnDuty ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/70 dark:text-yellow-300'
                            }`}>
                            {record.status}
                            </span>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};


const FacultyDetailPage: React.FC<FacultyDetailPageProps> = ({ empId, onBack, theme }) => {
  const { faculty, filteredAttendance, monthStats, leaveApplications, loading, error, selectedMonth, setSelectedMonth, fetchData, deleteLeave } = useFacultyDetailData(empId);
  const [selectedLeave, setSelectedLeave] = useState<LeaveApplicationRecord | null>(null);
  const [leaveToDelete, setLeaveToDelete] = useState<LeaveApplicationRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaveSectionOpen, setIsLeaveSectionOpen] = useState(false);
  
  const handleDownloadPdf = (leave: LeaveApplicationRecord) => {
    if (!faculty) return;
    const details: LeaveApplicationDetails = {
        faculty,
        startDate: leave.startDate,
        endDate: leave.endDate,
        reason: leave.reason,
        leaveType: leave.leaveType,
        applicationId: leave.id,
        submissionTimestamp: new Date(leave.submissionTimestamp),
    };
    generateLeaveApplicationPDF(details);
  };

  const handleDeleteRequest = (leave: LeaveApplicationRecord) => {
    setLeaveToDelete(leave);
  };

  const handleConfirmDelete = async () => {
    if (leaveToDelete) {
        setIsDeleting(true);
        try {
            await deleteLeave(leaveToDelete);
        } catch (e) {
            console.error("Deletion failed", e);
        } finally {
            setIsDeleting(false);
            setLeaveToDelete(null);
        }
    }
  };
  
    const getStatusBadge = (status: LeaveStatus) => {
        switch (status) {
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/70 dark:text-yellow-300';
            case 'Approved':
                return 'bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-300';
            case 'Rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-300';
        }
    };

    const getStatusIcon = (status: LeaveStatus) => {
        switch(status) {
            case 'Pending': return <Clock size={14} />;
            case 'Approved': return <CheckCircle size={14} />;
            case 'Rejected': return <XCircle size={14} />;
        }
    };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-highlight" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded-lg dark:bg-red-900/50 dark:border-red-700 dark:text-red-300" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  if (!faculty) {
    return <div>Faculty not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors text-text-secondary hover:bg-accent hover:text-text-primary dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200">
          <ArrowLeft size={16} />
          Back
        </button>
      </div>
      
      <div className="bg-secondary p-6 rounded-lg shadow-xl dark:bg-slate-800">
        <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0 w-28 h-28 rounded-full bg-gradient-to-br from-teal-400 to-highlight flex items-center justify-center shadow-lg">
                <User size={64} className="text-white"/>
            </div>
            <div className="flex-grow text-center md:text-left">
                <h2 className="text-3xl font-bold text-text-primary dark:text-slate-100">{faculty.name}</h2>
                <p className="text-text-secondary dark:text-slate-400">Employee ID: {faculty.empId}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 mt-2 text-sm text-text-primary dark:text-slate-300">
                    <span className="flex items-center gap-2"><Building size={16} className="text-text-secondary dark:text-slate-500"/>{faculty.dept}</span>
                    <span className="flex items-center gap-2"><Briefcase size={16} className="text-text-secondary dark:text-slate-500"/>{faculty.designation}</span>
                </div>
            </div>
             <div className="relative self-center md:self-start">
                <label htmlFor="month-select" className="block text-xs font-medium text-text-secondary dark:text-slate-400 mb-1">View Month</label>
                <CalendarIcon size={16} className="absolute left-3 top-8 text-text-secondary dark:text-slate-400" />
                <input
                    id="month-select"
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full bg-primary border border-accent rounded-md p-2 pl-10 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                />
            </div>
        </div>
      </div>

       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard title="Present Days" value={monthStats.present} icon={<Clock size={24} className="text-green-500"/>} />
            <StatCard title="Late Days" value={monthStats.late} icon={<AlertTriangle size={24} className="text-red-500"/>} />
            <StatCard title="Absent Days" value={monthStats.absent} icon={<UserX size={24} className="text-yellow-500"/>} />
            <StatCard title="On-Duty" value={monthStats.onDuty} icon={<ClipboardCheck size={24} className="text-blue-500"/>} />
            <StatCard title="Applied Leave" value={monthStats.appliedLeave} icon={<CalendarCheck size={24} className="text-purple-500"/>} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-secondary p-6 rounded-lg shadow-xl dark:bg-slate-800">
                <h3 className="text-xl font-semibold mb-4 text-highlight dark:text-teal-300">Monthly Attendance Calendar</h3>
                <CalendarView attendanceData={filteredAttendance} month={selectedMonth} theme={theme}/>
            </div>
             <div className="lg:col-span-2 bg-secondary p-6 rounded-lg shadow-xl dark:bg-slate-800">
                <h3 className="text-xl font-semibold mb-4 text-highlight dark:text-teal-300">Detailed Record Log</h3>
                <DetailRecordTable data={filteredAttendance} />
            </div>
        </div>
        
        <div className="bg-secondary rounded-lg shadow-xl dark:bg-slate-800 overflow-hidden">
             <button 
                onClick={() => setIsLeaveSectionOpen(!isLeaveSectionOpen)}
                className="w-full flex justify-between items-center text-left p-4 bg-primary/50 dark:bg-slate-900/50 hover:bg-accent/60 dark:hover:bg-slate-700/50 transition-colors"
                aria-expanded={isLeaveSectionOpen}
                aria-controls="leave-details-section"
            >
                <h3 className="text-xl font-semibold text-highlight dark:text-teal-300">Leave Details & Application</h3>
                {isLeaveSectionOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {isLeaveSectionOpen && (
                <div id="leave-details-section" className="p-6 border-t border-accent dark:border-slate-700">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                           <LeaveManagement faculty={faculty} onLeaveApplied={fetchData} leaveApplications={leaveApplications} />
                        </div>
                        <div className="space-y-4">
                             <h4 className="text-lg font-semibold text-highlight dark:text-teal-300">
                                Submitted Applications
                            </h4>
                            {leaveApplications.length > 0 ? (
                                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                    {leaveApplications.map((leave) => {
                                        const days = (new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 3600 * 24) + 1;
                                        return (
                                        <div key={leave.id} className="p-4 rounded-lg bg-primary dark:bg-slate-900/50">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div className="flex items-start gap-4 flex-1">
                                                    <div className="bg-highlight/20 p-3 rounded-full flex-shrink-0 mt-1">
                                                        <FileText className="h-6 w-6 text-highlight" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-text-primary dark:text-slate-200">{leave.leaveType}</p>
                                                        <p className="text-sm text-text-secondary dark:text-slate-400">
                                                            {days} {days > 1 ? 'days' : 'day'}: {leave.startDate} to {leave.endDate}
                                                        </p>
                                                        <span className={`mt-2 inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(leave.status)}`}>
                                                            {getStatusIcon(leave.status)}
                                                            {leave.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                                                    <button 
                                                        onClick={() => setSelectedLeave(leave)}
                                                        className="p-2 text-sm rounded-md flex items-center gap-1.5 bg-accent text-text-primary hover:bg-highlight/20 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                                                    >
                                                        Details <ChevronRight size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDownloadPdf(leave)}
                                                        className="p-2 text-sm rounded-md flex items-center gap-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900"
                                                    >
                                                        <FileDown size={16}/> PDF
                                                    </button>
                                                     {(leave.status === 'Pending' || leave.status === 'Rejected') && (
                                                        <button 
                                                            onClick={() => handleDeleteRequest(leave)}
                                                            className="p-2 text-sm rounded-md flex items-center gap-1.5 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900"
                                                        >
                                                            <Trash2 size={16}/> Delete
                                                        </button>
                                                     )}
                                                </div>
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            ) : (
                                <div className="text-center py-10 px-4 bg-primary rounded-lg dark:bg-slate-900/50">
                                    <Inbox className="mx-auto h-10 w-10 text-text-secondary dark:text-slate-500" />
                                    <p className="mt-2 text-sm text-text-secondary dark:text-slate-400">No leave applications found for this faculty member.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
        
        {leaveToDelete && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className="bg-secondary dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
                    <div className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                            </div>
                            <div className="mt-0 text-center sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-text-primary dark:text-slate-100">
                                    Delete Leave Application
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-text-secondary dark:text-slate-400">
                                        Are you sure you want to delete this leave from <strong className="dark:text-slate-200">{leaveToDelete.startDate}</strong> to <strong className="dark:text-slate-200">{leaveToDelete.endDate}</strong>? This will remove attendance records and cannot be undone.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-accent dark:bg-slate-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                        <button
                            type="button"
                            disabled={isDeleting}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-slate-500"
                            onClick={handleConfirmDelete}
                        >
                            {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setLeaveToDelete(null)}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-slate-600 dark:text-slate-200 dark:border-slate-500 dark:hover:bg-slate-500"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )}

        {selectedLeave && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedLeave(null)}>
                <div className="bg-secondary dark:bg-slate-800 rounded-lg shadow-xl max-w-lg w-full m-4" onClick={(e) => e.stopPropagation()}>
                    <div className="p-6 border-b border-accent dark:border-slate-700 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-highlight dark:text-teal-300">Leave Application Details</h3>
                        <button onClick={() => setSelectedLeave(null)} className="p-1 rounded-full hover:bg-accent dark:hover:bg-slate-700">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                         <div>
                            <p className="text-sm font-medium text-text-secondary dark:text-slate-400">Status</p>
                            <p className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedLeave.status)}`}>
                                {getStatusIcon(selectedLeave.status)}
                                {selectedLeave.status}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary dark:text-slate-400">Dates</p>
                            <p className="text-text-primary dark:text-slate-200">{selectedLeave.startDate} to {selectedLeave.endDate}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary dark:text-slate-400">Type</p>
                            <p className="text-text-primary dark:text-slate-200">{selectedLeave.leaveType}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary dark:text-slate-400">Reason</p>
                            <p className="text-text-primary dark:text-slate-200 whitespace-pre-wrap bg-primary dark:bg-slate-900/50 p-3 rounded-md">{selectedLeave.reason}</p>
                        </div>
                    </div>
                     <div className="px-6 py-3 bg-accent dark:bg-slate-700/50 text-right rounded-b-lg">
                        <button 
                            onClick={() => setSelectedLeave(null)} 
                            className="px-4 py-2 text-sm rounded-md bg-highlight text-primary hover:bg-teal-300 dark:bg-teal-500 dark:hover:bg-teal-400"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};

export default FacultyDetailPage;