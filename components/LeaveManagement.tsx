import React, { useState } from 'react';
import { db } from '../firebase/config';
import { FacultyRecord, AttendanceStatus, LeaveApplicationRecord } from '../types';
import { generateLeaveApplicationPDF, LeaveApplicationDetails } from '../utils/pdfGenerator';
import { ref, push, update } from "firebase/database";
import { Wallet, CalendarX, FileText, Send, Loader2, FileDown, CheckCircle } from 'lucide-react';

interface LeaveManagementProps {
    faculty: FacultyRecord;
    onLeaveApplied: () => void;
    leaveApplications: LeaveApplicationRecord[];
}

const LeaveCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode }> =
({ title, value, icon }) => (
    <div className="bg-primary p-4 rounded-lg shadow-lg flex items-center space-x-3 dark:bg-gray-900/50">
        {icon}
        <div>
            <p className="text-sm text-text-secondary font-medium dark:text-gray-400">{title}</p>
            <p className="text-xl font-bold text-text-primary dark:text-gray-100">{value}</p>
        </div>
    </div>
);

const LeaveManagement: React.FC<LeaveManagementProps> = ({ faculty, onLeaveApplied, leaveApplications }) => {
    const today = new Date().toISOString().split("T")[0];

    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [reason, setReason] = useState("");
    const [leaveType, setLeaveType] = useState("Casual Leave");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pdfGenerated, setPdfGenerated] = useState(false);
    const [applicationDetails, setApplicationDetails] = useState<LeaveApplicationDetails | null>(null);

    // -------------------------------------
    // SUBMIT APPLICATION (v10 UPDATED)
    // -------------------------------------
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!startDate || !endDate || !reason) {
            setError("Please fill all the fields.");
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            setError("Start date cannot be after end date.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Create new key using modular push()
            const newLeaveRef = push(ref(db, "leaveApplications"));
            const newLeaveKey = newLeaveRef.key;

            if (!newLeaveKey) {
                setError("Failed to generate unique application ID.");
                setIsSubmitting(false);
                return;
            }

            const submissionTime = new Date();

            const leaveApplicationData: LeaveApplicationRecord = {
                id: newLeaveKey,
                empId: faculty.empId,
                name: faculty.name,
                dept: faculty.dept,
                startDate,
                endDate,
                reason,
                leaveType,
                status: "Pending",
                submissionTimestamp: submissionTime.toISOString(),
            };

            const updates: Record<string, any> = {};
            updates[`/leaveApplications/${newLeaveKey}`] = leaveApplicationData;

            const startParts = startDate.split("-").map(Number);
            const endParts = endDate.split("-").map(Number);

            let currentDate = new Date(Date.UTC(startParts[0], startParts[1] - 1, startParts[2]));
            const lastDate = new Date(Date.UTC(endParts[0], endParts[1] - 1, endParts[2]));

            let newStatus = AttendanceStatus.Absent;
            if (leaveType === "On-Duty") newStatus = AttendanceStatus.OnDuty;

            while (currentDate <= lastDate) {
                const date = currentDate.toISOString().split("T")[0];
                updates[`/attendance/${faculty.empId}/records/${date}`] = {
                    inTime: "00:00:00",
                    status: newStatus,
                    leaveApplicationId: newLeaveKey,
                };

                currentDate.setUTCDate(currentDate.getUTCDate() + 1);
            }

            // Perform atomic multi-path update
            await update(ref(db), updates);

            setApplicationDetails({
                faculty,
                startDate,
                endDate,
                reason,
                leaveType,
                applicationId: newLeaveKey,
                submissionTimestamp: submissionTime,
            });

            setReason("");
            onLeaveApplied();
            setPdfGenerated(true);

        } catch (err) {
            console.error(err);
            setError("Failed to apply leave. Please try again.");
        }

        setIsSubmitting(false);
    };

    const handleDownloadPdf = () => {
        if (applicationDetails) generateLeaveApplicationPDF(applicationDetails);
    };

    React.useEffect(() => {
        setPdfGenerated(false);
        setApplicationDetails(null);
    }, [startDate, endDate, leaveType, reason]);

    return (
        <div className="bg-secondary p-6 rounded-lg shadow-xl dark:bg-gray-800">
            <h3 className="text-xl font-semibold mb-4 text-highlight dark:text-teal-300">
                Leave Details & Application
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <LeaveCard title="CL Balance" value={faculty.casualLeaves} icon={<Wallet size={24} className="text-purple-500" />} />
                <LeaveCard title="Applied (This Month)" value={`${leaveApplications.length} Request(s)`} icon={<FileText size={24} className="text-orange-500" />} />
            </div>

            <div className="border-t border-accent dark:border-gray-700 pt-6">
                <h4 className="font-semibold text-text-primary dark:text-gray-200 mb-2">Apply for Leave</h4>

                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-gray-400">Leave Type</label>
                            <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)}
                                className="mt-1 w-full bg-primary border border-accent rounded-md p-2 dark:bg-gray-700 dark:border-gray-600">
                                <option>Casual Leave</option>
                                <option>Sick Leave</option>
                                <option>On-Duty</option>
                                <option>Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-gray-400">Start Date</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required
                                className="mt-1 w-full bg-primary border border-accent rounded-md p-2 dark:bg-gray-700 dark:border-gray-600" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-gray-400">End Date</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required
                                className="mt-1 w-full bg-primary border border-accent rounded-md p-2 dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-gray-400">Reason</label>
                        <textarea value={reason} onChange={(e) => setReason(e.target.value)} required rows={3}
                            className="mt-1 w-full bg-primary border border-accent rounded-md p-2 dark:bg-gray-700 dark:border-gray-600"></textarea>
                    </div>

                    {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-4">

                        <button type="submit" disabled={isSubmitting || pdfGenerated}
                            className="w-full sm:w-auto flex justify-center items-center gap-2 bg-highlight text-primary font-bold py-2 px-4 rounded-md hover:bg-teal-300 disabled:bg-gray-500 transition-colors dark:bg-teal-500 dark:hover:bg-teal-400">
                            
                            {isSubmitting ? <Loader2 className="animate-spin" /> : pdfGenerated ? <CheckCircle /> : <Send />}
                            {pdfGenerated ? "Application Saved" : "Submit Application"}
                        </button>

                        {pdfGenerated && (
                            <button type="button" onClick={handleDownloadPdf}
                                className="w-full sm:w-auto flex justify-center items-center gap-2 bg-blue-500 text-primary font-bold py-2 px-4 rounded-md hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700">
                                <FileDown /> Download Application PDF
                            </button>
                        )}
                    </div>

                </form>
            </div>
        </div>
    );
};

export default LeaveManagement;
