import React, { useState, useMemo } from 'react';
import { useLeaveApprovalData } from '../hooks/useLeaveApprovalData';
import { LeaveApplicationRecord, LeaveStatus } from '../types';
import { Loader2, AlertTriangle, RefreshCw, CheckCircle, XCircle, Clock, Search, Inbox } from 'lucide-react';

const LeaveApprovalPage: React.FC = () => {
    const { leaveApplications, loading, error, approveLeave, rejectLeave, refresh, clearError } = useLeaveApprovalData();
    const [filterStatus, setFilterStatus] = useState<LeaveStatus>('Pending');
    const [actionState, setActionState] = useState<{ type: 'approving' | 'rejecting'; leaveId: string } | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredApplications = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return leaveApplications
            .filter(app => app.status === filterStatus)
            .filter(app => 
                app.name.toLowerCase().includes(query) || 
                String(app.empId).includes(query)
            );
    }, [leaveApplications, filterStatus, searchQuery]);

    const handleAction = async (action: 'approve' | 'reject', leave: LeaveApplicationRecord) => {
        setActionState({ type: action === 'approve' ? 'approving' : 'rejecting', leaveId: leave.id });
        setFeedback(null);
        clearError();
        try {
            if (action === 'approve') {
                await approveLeave(leave.id);
                setFeedback({ type: 'success', message: `Leave for ${leave.name} has been approved.` });
            } else {
                await rejectLeave(leave.id);
                setFeedback({ type: 'success', message: `Leave for ${leave.name} has been rejected.` });
            }
        } catch (err) {
            setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'An error occurred.' });
        } finally {
            setActionState(null);
        }
    };

    const TabButton: React.FC<{ status: LeaveStatus, children: React.ReactNode }> = ({ status, children }) => {
        const count = leaveApplications.filter(app => app.status === status).length;
        return (
            <button
              onClick={() => setFilterStatus(status)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-highlight text-primary dark:bg-teal-500 dark:text-gray-100'
                  : 'text-text-secondary hover:bg-accent hover:text-text-primary dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {children} ({count})
            </button>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
             <div className="bg-secondary p-6 sm:p-8 rounded-lg shadow-xl dark:bg-gray-800">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-semibold text-highlight dark:text-teal-300">
                            Leave Approval Requests
                        </h2>
                        <p className="mt-1 text-text-secondary dark:text-gray-400">
                            Review and process leave applications submitted by faculty.
                        </p>
                    </div>
                    <button onClick={refresh} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors text-text-secondary hover:bg-accent hover:text-text-primary dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:opacity-50">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
                
                {feedback && (
                    <div className={`mb-4 p-4 rounded-md text-sm flex items-start gap-3 ${feedback.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-300'}`}>
                        {feedback.type === 'success' ? <CheckCircle className="h-5 w-5 mt-0.5"/> : <AlertTriangle className="h-5 w-5 mt-0.5"/>}
                        {feedback.message}
                    </div>
                )}
                 {error && !feedback && (
                    <div className="mb-4 bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded-lg dark:bg-red-900/50 dark:border-red-700 dark:text-red-300" role="alert">
                        <strong className="font-bold mr-2">Error:</strong> {error}
                    </div>
                )}
                
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                    <nav className="w-full md:w-auto flex flex-wrap items-center gap-2 bg-primary dark:bg-gray-900/50 p-1 rounded-lg">
                        <TabButton status="Pending"><Clock size={16}/> Pending</TabButton>
                        <TabButton status="Approved"><CheckCircle size={16}/> Approved</TabButton>
                        <TabButton status="Rejected"><XCircle size={16}/> Rejected</TabButton>
                    </nav>
                     <div className="relative w-full md:w-64">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary dark:text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search by name or ID..."
                            className="w-full bg-primary border border-accent rounded-md p-2 pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex justify-center items-center py-20"><Loader2 className="h-10 w-10 animate-spin text-highlight" /></div>
                    ) : filteredApplications.length === 0 ? (
                        <div className="text-center py-20 px-6 bg-primary rounded-lg dark:bg-gray-900/50">
                            <Inbox className="mx-auto h-12 w-12 text-highlight dark:text-teal-300" />
                            <h3 className="mt-4 text-xl font-semibold text-text-primary dark:text-gray-200">No Applications Found</h3>
                            <p className="mt-1 text-text-secondary dark:text-gray-400">
                                There are no {filterStatus.toLowerCase()} applications matching your search.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredApplications.map(leave => {
                                const isActing = actionState?.leaveId === leave.id;
                                const days = (new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 3600 * 24) + 1;
                                return (
                                <div key={leave.id} className="bg-primary dark:bg-gray-900/80 p-4 rounded-lg flex flex-col lg:flex-row items-start justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="font-semibold text-text-primary dark:text-gray-200">{leave.name} <span className="text-sm font-normal text-text-secondary dark:text-gray-400">(ID: {leave.empId})</span></div>
                                        <div className="text-sm text-text-secondary dark:text-gray-400"><strong>Dates:</strong> {leave.startDate} to {leave.endDate} ({days} {days > 1 ? 'days' : 'day'})</div>
                                        <div className="text-sm text-text-secondary dark:text-gray-400"><strong>Type:</strong> {leave.leaveType}</div>
                                        <div className="text-sm text-text-primary dark:text-gray-300 pt-1 border-t border-accent dark:border-gray-700/50 mt-2"><strong>Reason:</strong> {leave.reason}</div>
                                    </div>
                                    {filterStatus === 'Pending' && (
                                    <div className="flex items-center gap-2 self-end lg:self-center">
                                        <button 
                                            onClick={() => handleAction('approve', leave)} 
                                            disabled={isActing}
                                            className="w-28 flex justify-center items-center gap-2 px-3 py-1 text-sm rounded-md bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-400 transition-colors"
                                        >
                                            {isActing && actionState.type === 'approving' ? <Loader2 className="h-4 w-4 animate-spin"/> : <><CheckCircle size={16}/> Approve</>}
                                        </button>
                                        <button 
                                            onClick={() => handleAction('reject', leave)}
                                            disabled={isActing}
                                            className="w-28 flex justify-center items-center gap-2 px-3 py-1 text-sm rounded-md bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-400 transition-colors"
                                        >
                                            {isActing && actionState.type === 'rejecting' ? <Loader2 className="h-4 w-4 animate-spin"/> : <><XCircle size={16}/> Reject</>}
                                        </button>
                                    </div>
                                    )}
                                </div>
                            )})}
                        </div>
                    )}
                </div>
             </div>
        </div>
    );
};

export default LeaveApprovalPage;