import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase/config';
import { FacultyRecord, AttendanceRecord, AttendanceStatus } from '../types';
import { Calendar, Loader2 } from 'lucide-react';
import { ref, get, set, update } from "firebase/database";

type FacultyWithAttendance = FacultyRecord & {
  status: AttendanceStatus | 'Not Marked';
  inTime?: string;
};

const ManualAttendance: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [facultyWithAttendance, setFacultyWithAttendance] = useState<FacultyWithAttendance[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState<{ [empId: number]: boolean }>({});
  const [error, setError] = useState<string | null>(null);

  // --------------------------------------------------
  // FETCH DATA (Firebase v10)
  // --------------------------------------------------
  const fetchDataForDate = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);

    try {
      const facultySnapshot = await get(ref(db, 'faculty'));
      const attendanceSnapshot = await get(ref(db, 'attendance'));

      if (!facultySnapshot.exists()) {
        throw new Error("No faculty data found in the database.");
      }

      // Faculty list
      const facultyData = facultySnapshot.val();
      const facultyList: FacultyRecord[] = Object.keys(facultyData).map(empId => ({
        empId: parseInt(empId, 10),
        ...facultyData[empId],
      }));

      // Attendance map for the date
      const attendanceForDate = new Map<number, { status: AttendanceStatus; inTime: string }>();

      if (attendanceSnapshot.exists()) {
        const attendanceData = attendanceSnapshot.val();
        for (const empId in attendanceData) {
          const record = attendanceData[empId]?.records?.[date];
          if (record) {
            attendanceForDate.set(parseInt(empId, 10), {
              status: record.status,
              inTime: record.inTime,
            });
          }
        }
      }

      // Merge
      const merged = facultyList.map((faculty): FacultyWithAttendance => {
        const att = attendanceForDate.get(faculty.empId);
        return {
          ...faculty,
          status: att ? att.status : 'Not Marked',
          inTime: att?.inTime,
        };
      });

      // Sort
      const sortOrder: Record<AttendanceStatus | 'Not Marked', number> = {
        'Not Marked': 1,
        [AttendanceStatus.Late]: 2,
        [AttendanceStatus.OnTime]: 3,
        [AttendanceStatus.Absent]: 4,
        [AttendanceStatus.OnDuty]: 5,
      };

      merged.sort((a, b) => {
        const aOrder = sortOrder[a.status];
        const bOrder = sortOrder[b.status];
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.name.localeCompare(b.name);
      });

      setFacultyWithAttendance(merged);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to fetch data.");
    }

    setLoading(false);
  }, []);

  // Fetch on date change
  useEffect(() => {
    fetchDataForDate(selectedDate);
  }, [selectedDate, fetchDataForDate]);

  // --------------------------------------------------
  // UPDATE ATTENDANCE (Firebase v10)
  // --------------------------------------------------
  const handleMarkAttendance = async (
    empId: number,
    markAs: "Present" | "Leave" | "On-Duty"
  ) => {
    setUpdatingStatus(prev => ({ ...prev, [empId]: true }));

    const current = facultyWithAttendance.find(f => f.empId === empId);
    if (!current) {
      console.error("Faculty not found");
      setUpdatingStatus(prev => ({ ...prev, [empId]: false }));
      return;
    }

    try {
      const recordPath = `attendance/${empId}/records/${selectedDate}`;

      let newStatus: AttendanceStatus;
      switch (markAs) {
        case "Present": newStatus = AttendanceStatus.OnTime; break;
        case "Leave": newStatus = AttendanceStatus.Absent; break;
        case "On-Duty": newStatus = AttendanceStatus.OnDuty; break;
      }

      // If record exists and status is Late → update only status
      if (current.status === AttendanceStatus.Late) {
        await set(ref(db, `${recordPath}/status`), newStatus);

        setFacultyWithAttendance(prev =>
          prev.map(f =>
            f.empId === empId ? { ...f, status: newStatus } : f
          )
        );
      } else {
        // Full record update
        const newInTime = markAs === "Present" ? "08:00:00" : "00:00:00";
        const newRecord = { status: newStatus, inTime: newInTime };

        await set(ref(db, recordPath), newRecord);

        setFacultyWithAttendance(prev =>
          prev.map(f =>
            f.empId === empId ? { ...f, ...newRecord } : f
          )
        );
      }

    } catch (err) {
      console.error("Failed to update attendance", err);
      alert("Failed to update attendance. Check console for details.");
    }

    setUpdatingStatus(prev => ({ ...prev, [empId]: false }));
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  const getStatusBadge = (status: AttendanceStatus | 'Not Marked') => {
    switch (status) {
      case AttendanceStatus.OnTime: return 'bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-300';
      case AttendanceStatus.Late: return 'bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-300';
      case AttendanceStatus.OnDuty: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-300';
      case AttendanceStatus.Absent: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/70 dark:text-yellow-300';
      case 'Not Marked': return 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Picker */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-primary dark:bg-gray-900/80 rounded-lg border border-accent dark:border-gray-700">
        <h3 className="text-lg font-semibold text-text-primary dark:text-gray-200">Select Date</h3>
        <div className="relative">
          <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary dark:text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-auto bg-secondary border border-accent rounded-md p-2 pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          />
        </div>
      </div>

      {/* Loading / Error */}
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-highlight" />
        </div>
      ) : error ? (
        <div className="text-red-600 dark:text-red-400 text-center py-10">{error}</div>
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {facultyWithAttendance.map(faculty => (
            <div key={faculty.empId} className="bg-primary dark:bg-gray-900 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex-1">
                <p className="font-semibold text-text-primary dark:text-gray-200">{faculty.name}</p>
                <p className="text-sm text-text-secondary dark:text-gray-400">ID: {faculty.empId} | Dept: {faculty.dept}</p>
              </div>

              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(faculty.status)}`}>
                  {faculty.status}
                </span>

                <div className="w-64 flex justify-end">
                  {(faculty.status === 'Not Marked' ||
                    faculty.status === AttendanceStatus.Absent ||
                    faculty.status === AttendanceStatus.Late) ? (
                    updatingStatus[faculty.empId] ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => handleMarkAttendance(faculty.empId, 'Present')} className="px-3 py-1 text-sm rounded-md bg-green-500 text-white hover:bg-green-600">
                          Present
                        </button>
                        <button onClick={() => handleMarkAttendance(faculty.empId, 'Leave')} className="px-3 py-1 text-sm rounded-md bg-yellow-500 text-white hover:bg-yellow-600">
                          Leave
                        </button>
                        <button onClick={() => handleMarkAttendance(faculty.empId, 'On-Duty')} className="px-3 py-1 text-sm rounded-md bg-blue-500 text-white hover:bg-blue-600">
                          On-Duty
                        </button>
                      </div>
                    )
                  ) : (
                    <p className="text-sm text-text-secondary dark:text-gray-500 italic">Record exists</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default ManualAttendance;
