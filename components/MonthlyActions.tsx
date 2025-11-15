import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { FacultyRecord, AttendanceStatus } from '../types';
import { Calendar, Gift, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { ref, get, set, update } from "firebase/database";

const getPreviousMonth = (): string => {
    const today = new Date();
    today.setMonth(today.getMonth() - 1);
    return today.toISOString().slice(0, 7);
};

const MonthlyActions: React.FC = () => {
    const [selectedMonth, setSelectedMonth] = useState(getPreviousMonth());
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);
    const [isAllocationComplete, setIsAllocationComplete] = useState(false);

    // ---------------------------------------------------
    // Check allocation status each month
    // ---------------------------------------------------
    useEffect(() => {
        const checkStatus = async () => {
            if (!selectedMonth) return;
            setIsCheckingStatus(true);
            setIsAllocationComplete(false);
            setFeedback(null);

            try {
                const allocationSnap = await get(ref(db, `monthlyAllocations/${selectedMonth}`));
                if (allocationSnap.exists() && allocationSnap.val().completed) {
                    setIsAllocationComplete(true);
                }
            } catch (err) {
                console.error("Error checking allocation:", err);
                setFeedback({ type: "error", message: "Could not verify allocation status." });
            }

            setIsCheckingStatus(false);
        };

        checkStatus();
    }, [selectedMonth]);

    // ---------------------------------------------------
    // Allocate Casual Leave
    // ---------------------------------------------------
    const handleAllocateCL = async () => {
        if (isAllocationComplete) {
            setFeedback({ type: 'error', message: "This action has already been completed for the selected month." });
            return;
        }

        setIsLoading(true);
        setFeedback(null);

        try {
            // 1. Fetch faculty
            const facultySnap = await get(ref(db, 'faculty'));
            if (!facultySnap.exists()) {
                throw new Error("No faculty data found.");
            }

            const facultyData = facultySnap.val();
            const facultyList: FacultyRecord[] = Object.keys(facultyData).map(empId => ({
                empId: parseInt(empId),
                ...facultyData[empId]
            }));

            // 2. Fetch attendance
            const attendanceSnap = await get(ref(db, 'attendance'));
            const attendanceData = attendanceSnap.exists() ? attendanceSnap.val() : {};

            const facultyWithAbsences = new Set<number>();

            for (const empId in attendanceData) {
                const records = attendanceData[empId]?.records ?? {};
                for (const date in records) {
                    if (date.startsWith(selectedMonth) && records[date].status === AttendanceStatus.Absent) {
                        facultyWithAbsences.add(parseInt(empId));
                        break;
                    }
                }
            }

            // 3. Prepare batch update
            const updates: Record<string, number> = {};
            let updatedCount = 0;

            facultyList.forEach(faculty => {
                if (!facultyWithAbsences.has(faculty.empId)) {
                    const newCL = (faculty.casualLeaves || 0) + 1;
                    updates[`faculty/${faculty.empId}/casualLeaves`] = newCL;
                    updatedCount++;
                }
            });

            // 4. Write updates
            if (updatedCount > 0) {
                await update(ref(db), updates);
            }

            // 5. Save allocation record
            await set(ref(db, `monthlyAllocations/${selectedMonth}`), {
                completed: true,
                timestamp: new Date().toISOString(),
                updatedCount,
            });

            setIsAllocationComplete(true);

            if (updatedCount === 0) {
                setFeedback({
                    type: 'success',
                    message: `Completed. No faculty were eligible. Month is now locked.`
                });
            } else {
                setFeedback({
                    type: 'success',
                    message: `Allocated 1 CL to ${updatedCount} faculty members. Month is now locked.`
                });
            }

        } catch (err) {
            const msg = err instanceof Error ? err.message : "Unexpected error.";
            setFeedback({ type: 'error', message: `Allocation failed: ${msg}` });
        }

        setIsLoading(false);
    };

    // ---------------------------------------------------
    // UI
    // ---------------------------------------------------
    return (
        <div className="bg-secondary p-8 rounded-lg shadow-xl dark:bg-gray-800">
            <div className="text-center mb-8">
                <Gift className="mx-auto h-12 w-12 text-highlight dark:text-teal-300" />
                <h2 className="mt-4 text-2xl font-semibold text-text-primary dark:text-gray-100">
                    Monthly Actions
                </h2>
                <p className="mt-2 text-text-secondary dark:text-gray-400">
                    Run periodic administrative tasks for the application.
                </p>
            </div>

            {feedback && (
                <div className={`mb-6 p-4 rounded-md text-sm flex items-start gap-3 ${
                    feedback.type === 'success'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-300'
                }`}>
                    {feedback.type === 'success'
                        ? <CheckCircle className="h-5 w-5 mt-0.5" />
                        : <AlertTriangle className="h-5 w-5 mt-0.5" />}
                    {feedback.message}
                </div>
            )}

            <div className="space-y-4 p-4 border border-accent dark:border-gray-700 rounded-lg">
                <div>
                    <h3 className="font-semibold text-text-primary dark:text-gray-200">
                        Allocate Monthly Casual Leave
                    </h3>
                    <p className="text-sm text-text-secondary dark:text-gray-400">
                        Grants 1 CL to every faculty member with no "Absent" records for the selected month.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative flex-grow w-full sm:w-auto">
                        <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary dark:text-gray-400" />
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full bg-primary border border-accent rounded-md p-2 pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                        />
                    </div>

                    <button
                        onClick={handleAllocateCL}
                        disabled={isLoading || isCheckingStatus || isAllocationComplete}
                        className="w-full sm:w-auto flex justify-center items-center gap-2 bg-highlight text-primary font-bold py-2 px-4 rounded-md hover:bg-teal-300 disabled:bg-gray-500"
                    >
                        {isLoading || isCheckingStatus ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                {isCheckingStatus ? "Checking Status..." : "Processing..."}
                            </>
                        ) : (
                            "Run Allocation"
                        )}
                    </button>
                </div>

                {isAllocationComplete && !feedback && !isCheckingStatus && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Allocation for this month has already been completed.
                    </p>
                )}
            </div>
        </div>
    );
};

export default MonthlyActions;
