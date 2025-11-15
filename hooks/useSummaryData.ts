import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase/config';
import { AttendanceRecord, FacultyRecord, MonthlySummary, AttendanceStatus, Holiday } from '../types';
import { useSettings } from '../components/SettingsContext';
import { ref, get, update } from "firebase/database";

export const useSummaryData = () => {
    const { settings } = useSettings();

    const [rawAttendance, setRawAttendance] = useState<AttendanceRecord[]>([]);
    const [facultyList, setFacultyList] = useState<FacultyRecord[]>([]);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
    const [monthlyWorkingDays, setMonthlyWorkingDays] = useState<number>(0);
    const [summaryData, setSummaryData] = useState<MonthlySummary[]>([]);

    const [isAllocationRun, setIsAllocationRun] = useState<boolean>(false);
    const [isCheckingAllocation, setIsCheckingAllocation] = useState<boolean>(true);

    // -----------------------------
    // Update working days when month changes
    // -----------------------------
    useEffect(() => {
        if (selectedMonth) {
            const [year, month] = selectedMonth.split('-').map(Number);
            const daysInMonth = new Date(year, month, 0).getDate();
            setMonthlyWorkingDays(daysInMonth);
        }
    }, [selectedMonth]);

    // -----------------------------
    // Check allocation status
    // -----------------------------
    useEffect(() => {
        const checkAllocationStatus = async () => {
            if (!selectedMonth) return;
            setIsCheckingAllocation(true);
            setIsAllocationRun(false);

            try {
                const allocationRef = ref(db, `monthlyAllocations/${selectedMonth}`);
                const snapshot = await get(allocationRef);

                if (snapshot.exists() && snapshot.val().completed) {
                    setIsAllocationRun(true);
                }
            } catch (err) {
                console.error("Error checking allocation status:", err);
                setIsAllocationRun(false);
            } finally {
                setIsCheckingAllocation(false);
            }
        };

        checkAllocationStatus();
    }, [selectedMonth]);

    // -----------------------------
    // Fetch faculty, attendance, holidays
    // -----------------------------
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const facultyRef = ref(db, "faculty");
                const attendanceRef = ref(db, "attendance");
                const holidaysRef = ref(db, "holidays");

                const [facultySnapshot, attendanceSnapshot, holidaysSnapshot] = await Promise.all([
                    get(facultyRef),
                    get(attendanceRef),
                    get(holidaysRef)
                ]);

                // ------------------
                // Faculty
                // ------------------
                const faculty: FacultyRecord[] = [];
                if (facultySnapshot.exists()) {
                    const data = facultySnapshot.val();
                    for (const empId in data) {
                        faculty.push({ empId: parseInt(empId, 10), ...data[empId] });
                    }
                }
                setFacultyList(faculty.sort((a, b) => a.name.localeCompare(b.name)));

                // ------------------
                // Attendance
                // ------------------
                const flattened: AttendanceRecord[] = [];
                if (attendanceSnapshot.exists()) {
                    const data = attendanceSnapshot.val();
                    const facultyMap = new Map(faculty.map(f => [String(f.empId), f]));

                    for (const empId in data) {
                        const facultyDetails = facultyMap.get(empId) || {
                            name: `Unknown (${empId})`,
                            dept: "Unknown",
                            designation: "N/A",
                            salary: 0
                        };

                        const { records } = data[empId] || {};
                        if (records) {
                            for (const date in records) {
                                flattened.push({
                                    id: `${date}-${empId}`,
                                    empId: parseInt(empId, 10),
                                    name: facultyDetails.name,
                                    dept: facultyDetails.dept,
                                    date,
                                    inTime: records[date].inTime,
                                    status: records[date].status,
                                    leaveApplicationId: records[date].leaveApplicationId,
                                });
                            }
                        }
                    }
                }
                setRawAttendance(flattened);

                // ------------------
                // Holidays
                // ------------------
                const loadedHolidays: Holiday[] = [];
                if (holidaysSnapshot.exists()) {
                    const data = holidaysSnapshot.val();
                    for (const id in data) {
                        loadedHolidays.push({ id, ...data[id] });
                    }
                }
                setHolidays(loadedHolidays);
            } catch (err) {
                console.error("Error fetching summary data:", err);
                setError("Failed to load data for summary calculation.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // -----------------------------
    // Calculate summary
    // -----------------------------
    const calculateSummary = useCallback(() => {
        if (!facultyList.length || monthlyWorkingDays <= 0) {
            setSummaryData([]);
            return;
        }

        const attendanceForMonth = rawAttendance.filter(r =>
            r.date.startsWith(selectedMonth)
        );

        const attendanceByEmp = new Map<number, AttendanceRecord[]>();
        attendanceForMonth.forEach(rec => {
            if (!attendanceByEmp.has(rec.empId)) {
                attendanceByEmp.set(rec.empId, []);
            }
            attendanceByEmp.get(rec.empId)!.push(rec);
        });

        const holidaysInMonth = holidays.filter(h =>
            h.date.startsWith(selectedMonth)
        ).length;

        const actualWorkingDays = Math.max(0, monthlyWorkingDays - holidaysInMonth);

        const summary = facultyList.map(faculty => {
            const records = attendanceByEmp.get(faculty.empId) || [];

            const presentDays = records.filter(r =>
                r.status !== AttendanceStatus.Absent
            ).length;

            const absentDays = Math.max(0, actualWorkingDays - presentDays);

            const casualLeavesAvailable = faculty.casualLeaves || 0;
            const casualLeavesUsed = Math.min(absentDays, casualLeavesAvailable);

            const unpaidLeave = absentDays - casualLeavesUsed;

            const lateRecords = records.filter(r => r.status === AttendanceStatus.Late).length;

            const permissions = Math.min(lateRecords, settings.permissionLimit);
            const halfDayLeaves = Math.max(0, lateRecords - settings.permissionLimit);

            const totalLeaves = unpaidLeave + halfDayLeaves * 0.5;
            const payableDays = Math.max(0, actualWorkingDays - totalLeaves);

            const salary = faculty.salary || 0;
            const calculatedSalary =
                actualWorkingDays > 0 ? (payableDays / actualWorkingDays) * salary : 0;

            return {
                empId: faculty.empId,
                name: faculty.name,
                dept: faculty.dept,
                designation: faculty.designation,
                monthlySalary: faculty.salary,
                presentDays,
                permissions,
                halfDayLeaves,
                casualLeavesAvailable,
                casualLeavesUsed,
                unpaidLeave,
                totalLeaves,
                payableDays,
                calculatedSalary: parseFloat(calculatedSalary.toFixed(2)),
            };
        });

        setSummaryData(summary);
    }, [facultyList, rawAttendance, holidays, selectedMonth, monthlyWorkingDays, settings.permissionLimit]);

    useEffect(() => {
        calculateSummary();
    }, [calculateSummary]);

    // -----------------------------
    // Update payable days manually
    // -----------------------------
    const updatePayableDays = useCallback(
        (empId: number, newPayableDays: number) => {
            setSummaryData(prev =>
                prev.map(item => {
                    if (item.empId !== empId) return item;

                    const faculty = facultyList.find(f => f.empId === empId);
                    const salary = faculty?.salary || 0;

                    const holidaysInMonth = holidays.filter(h =>
                        h.date.startsWith(selectedMonth)
                    ).length;

                    const actualWorkingDays = Math.max(
                        0,
                        monthlyWorkingDays - holidaysInMonth
                    );

                    const newCalculated =
                        actualWorkingDays > 0
                            ? (newPayableDays / actualWorkingDays) * salary
                            : 0;

                    return {
                        ...item,
                        payableDays: newPayableDays,
                        calculatedSalary: parseFloat(newCalculated.toFixed(2)),
                    };
                })
            );
        },
        [facultyList, holidays, selectedMonth, monthlyWorkingDays]
    );

    // -----------------------------
    // Deduct CLs and finalize month
    // -----------------------------
    const finalizeAndDeductCLs = async () => {
        if (!summaryData.length) {
            throw new Error("No summary data to process.");
        }

        const updates: { [key: string]: number } = {};
        let deductions = 0;

        summaryData.forEach(item => {
            if (item.casualLeavesUsed > 0) {
                const newBalance =
                    item.casualLeavesAvailable - item.casualLeavesUsed;
                updates[`faculty/${item.empId}/casualLeaves`] = newBalance;
                deductions++;
            }
        });

        if (deductions === 0) return "No CL deductions needed.";

        await update(ref(db), updates);

        setFacultyList(prev =>
            prev.map(f => {
                const summary = summaryData.find(s => s.empId === f.empId);
                if (summary && summary.casualLeavesUsed > 0) {
                    return {
                        ...f,
                        casualLeaves:
                            f.casualLeaves - summary.casualLeavesUsed,
                    };
                }
                return f;
            })
        );

        return `CL deductions applied to ${deductions} faculty members.`;
    };

    return {
        summaryData,
        loading,
        error,
        clearError: () => setError(null),
        selectedMonth,
        setSelectedMonth,
        monthlyWorkingDays,
        setMonthlyWorkingDays,
        recalculate: calculateSummary,
        updatePayableDays,
        finalizeAndDeductCLs,
        isAllocationRun,
        isCheckingAllocation,
    };
};
