import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../firebase/config';
import { AttendanceRecord, FacultyRecord, AttendanceStatus, LeaveApplicationRecord } from '../types';
import { ref, get, update } from "firebase/database";

export const useFacultyDetailData = (empId: number) => {
    const [faculty, setFaculty] = useState<FacultyRecord | null>(null);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
       const [leaveApplications, setLeaveApplications] = useState<LeaveApplicationRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

    const fetchData = useCallback(async () => {
        if (!empId) return;

        setLoading(true);
        setError(null);

        try {
            const facultyRef = ref(db, `faculty/${empId}`);
            const attendanceRef = ref(db, `attendance/${empId}/records`);
            const leaveAppRef = ref(db, `leaveApplications`);

            const [facultySnap, attendanceSnap, leaveSnap] = await Promise.all([
                get(facultyRef),
                get(attendanceRef),
                get(leaveAppRef),
            ]);

            // Faculty
            if (facultySnap.exists()) {
                setFaculty({ empId, ...facultySnap.val() });
            } else {
                throw new Error("Faculty member not found.");
            }

            // Attendance
            if (attendanceSnap.exists()) {
                const records = attendanceSnap.val();
                const loadedAttendance: AttendanceRecord[] = Object.entries(records).map(
                    ([date, record]: [string, any]) => ({
                        id: `${date}-${empId}`,
                        empId,
                        name: facultySnap.val().name,
                        dept: facultySnap.val().dept,
                        date,
                        inTime: record.inTime,
                        status: record.status,
                        leaveApplicationId: record.leaveApplicationId,
                    })
                );

                setAttendance(
                    loadedAttendance.sort((a, b) => b.date.localeCompare(a.date))
                );
            } else {
                setAttendance([]);
            }

            // Leave Applications
            if (leaveSnap.exists()) {
                const leaves = leaveSnap.val();
                const loadedLeaves: LeaveApplicationRecord[] =
                    (Object.values(leaves) as LeaveApplicationRecord[])
                        .filter((leave) => leave.empId === empId)
                        .sort((a, b) => b.startDate.localeCompare(a.startDate));

                setLeaveApplications(loadedLeaves);
            } else {
                setLeaveApplications([]);
            }

        } catch (err) {
            console.error("Error fetching faculty detail data:", err);
            setError("Failed to load data for this faculty member.");
        } finally {
            setLoading(false);
        }
    }, [empId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // FILTER attendance by selected month
    const filteredAttendance = useMemo(() => {
        return attendance.filter((r) => r.date.startsWith(selectedMonth));
    }, [attendance, selectedMonth]);

    // FILTER leaves by month
    const filteredLeaveApplications = useMemo(() => {
        return leaveApplications.filter(
            (app) =>
                app.startDate.startsWith(selectedMonth) ||
                app.endDate.startsWith(selectedMonth)
        );
    }, [leaveApplications, selectedMonth]);

    // MONTH STATS
    const monthStats = useMemo(() => {
        const onTime = filteredAttendance.filter(r => r.status === AttendanceStatus.OnTime).length;
        const late = filteredAttendance.filter(r => r.status === AttendanceStatus.Late).length;
        const absent = filteredAttendance.filter(r => r.status === AttendanceStatus.Absent).length;
        const onDuty = filteredAttendance.filter(r => r.status === AttendanceStatus.OnDuty).length;
        const present = onTime + late + onDuty;

        const clUsed = Math.min(absent, faculty?.casualLeaves ?? 0);
        const unpaid = absent - clUsed;

        const applied = filteredAttendance.filter(r => !!r.leaveApplicationId).length;

        return {
            onTime,
            late,
            absent,
            onDuty,
            present,
            clUsedThisMonth: clUsed,
            unpaidLeave: unpaid,
            appliedLeave: applied,
        };
    }, [filteredAttendance, faculty]);

    // DELETE Leave Application
    const deleteLeave = useCallback(
        async (leave: LeaveApplicationRecord) => {
            if (!empId) return;

            try {
                setError(null);

                const updates: Record<string, null> = {};

                // Remove leave record
                updates[`leaveApplications/${leave.id}`] = null;

                // Remove corresponding attendance records
                const start = new Date(leave.startDate);
                const end = new Date(leave.endDate);

                const current = new Date(start);

                while (current <= end) {
                    const d = current.toISOString().split("T")[0];
                    updates[`attendance/${empId}/records/${d}`] = null;
                    current.setDate(current.getDate() + 1);
                }

                await update(ref(db), updates);

                await fetchData();
            } catch (err) {
                console.error("Error deleting leave:", err);
                const msg = "Failed to delete leave. Please try again.";
                setError(msg);
                throw new Error(msg);
            }
        },
        [empId, fetchData]
    );

    return {
        faculty,
        filteredAttendance,
        monthStats,
        leaveApplications: filteredLeaveApplications,
        loading,
        error,
        selectedMonth,
        setSelectedMonth,
        fetchData,
        deleteLeave,
        clearError: () => setError(null),
    };
};
