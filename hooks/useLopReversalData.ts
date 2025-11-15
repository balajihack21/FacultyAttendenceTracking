import { useState, useCallback } from 'react';
import { db } from '../firebase/config';
import { FacultyRecord, AttendanceRecord, AttendanceStatus } from '../types';
import { ref, get, update } from "firebase/database";

export interface FacultyWithLop {
  empId: number;
  name: string;
  unpaidLeave: number;
  absentDates: string[];
}

export const useLopReversalData = () => {
  const [facultyWithLop, setFacultyWithLop] = useState<FacultyWithLop[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------
  // Fetch & process LOP data
  // -------------------------------
  const fetchAndProcessData = useCallback(
    async (selectedMonth: string, monthlyWorkingDays: number) => {
      if (!selectedMonth || monthlyWorkingDays <= 0) {
        setFacultyWithLop([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const facultyRef = ref(db, "faculty");
        const attendanceRef = ref(db, "attendance");

        const [facultySnapshot, attendanceSnapshot] = await Promise.all([
          get(facultyRef),
          get(attendanceRef)
        ]);

        if (!facultySnapshot.exists()) {
          throw new Error("No faculty data found.");
        }

        // Load faculty list
        const facultyList: FacultyRecord[] = [];
        facultySnapshot.forEach(child => {
          facultyList.push({
            empId: parseInt(child.key!, 10),
            ...child.val()
          });
        });

        // Load attendance records
        const allAttendance: AttendanceRecord[] = [];

        if (attendanceSnapshot.exists()) {
          const attendanceData = attendanceSnapshot.val();

          for (const empId in attendanceData) {
            const records = attendanceData[empId].records || {};

            for (const date in records) {
              if (date.startsWith(selectedMonth)) {
                allAttendance.push({
                  id: `${date}-${empId}`,
                  empId: parseInt(empId, 10),
                  name: "",
                  dept: "",
                  date,
                  ...records[date]
                });
              }
            }
          }
        }

        // Process LOP calculations
        const processedData: FacultyWithLop[] = [];

        for (const faculty of facultyList) {
          const records = allAttendance.filter(
            rec => rec.empId === faculty.empId
          );

          const presentDays = records.filter(
            r => r.status !== AttendanceStatus.Absent
          ).length;

          const absentDays = Math.max(0, monthlyWorkingDays - presentDays);

          const casualLeavesAvailable = faculty.casualLeaves || 0;
          const casualLeavesUsed = Math.min(absentDays, casualLeavesAvailable);
          const unpaidLeave = absentDays - casualLeavesUsed;

          if (unpaidLeave > 0) {
            const absentDates = records
              .filter(r => r.status === AttendanceStatus.Absent)
              .map(r => r.date)
              .sort((a, b) => a.localeCompare(b));

            processedData.push({
              empId: faculty.empId,
              name: faculty.name,
              unpaidLeave,
              absentDates
            });
          }
        }

        setFacultyWithLop(
          processedData.sort((a, b) => a.name.localeCompare(b.name))
        );
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while processing LOP data."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // -------------------------------
  // Reverse LOP for a specific record
  // -------------------------------
  const reverseLop = useCallback(async (empId: number, date: string) => {
    try {
      await update(ref(db, `attendance/${empId}/records/${date}`), {
        status: AttendanceStatus.OnTime,
        inTime: "08:00:00"
      });
    } catch (err) {
      console.error("Failed to reverse LOP:", err);
      throw new Error("Database update failed. Please try again.");
    }
  }, []);

  return {
    facultyWithLop,
    loading,
    error,
    fetchAndProcessData,
    reverseLop
  };
};
