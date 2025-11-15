import { useState, useMemo, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../firebase/config';
import { ref, get, update } from "firebase/database";
import { AttendanceRecord, AttendanceStatus } from '../types';
import { useSettings } from '../components/SettingsContext';

const processRawData = (jsonData: any[], date: string, onTimeThreshold: string): AttendanceRecord[] => {
  return jsonData.map((row, index) => {
    const normalizedRow: { [key: string]: any } = {};
    for (const key in row) {
      normalizedRow[key.toLowerCase().replace(/\s/g, '')] = row[key];
    }

    const empId = normalizedRow['emp.id'] || normalizedRow['empid'] || index;
    const rawInTime = normalizedRow['in.time'] || normalizedRow['intime'];

    let inTime: string;

    if (typeof rawInTime === 'number') {
      inTime = XLSX.SSF.format('HH:mm:ss', rawInTime);
    } else if (typeof rawInTime === 'string') {
      if (/^\d{1,2}:\d{2}$/.test(rawInTime)) inTime = `${rawInTime}:00`;
      else inTime = rawInTime;
    } else {
      inTime = '00:00:00';
    }

    let status: AttendanceStatus;
    if (inTime === '00:00:00') status = AttendanceStatus.Absent;
    else if (inTime <= onTimeThreshold) status = AttendanceStatus.OnTime;
    else status = AttendanceStatus.Late;

    return {
      id: `${date}-${empId}`,
      empId,
      name: normalizedRow['name'] || 'N/A',
      dept: normalizedRow['dept'] || 'N/A',
      inTime: status === AttendanceStatus.Absent ? '00:00:00' : inTime,
      status,
      date,
    };
  });
};

export const useAttendanceData = () => {
  const { settings } = useSettings();
  const [allData, setAllData] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'error' | 'success' | 'warning', message: string } | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const [startDateFilter, setStartDateFilter] = useState<string>(today);
  const [endDateFilter, setEndDateFilter] = useState<string>(today);
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [facultyNameFilter, setFacultyNameFilter] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch faculty
        const facultySnap = await get(ref(db, 'faculty'));
        const facultyMap = new Map<string, { name: string; dept: string }>();

        if (facultySnap.exists()) {
          const facultyData = facultySnap.val();
          for (const empId in facultyData) {
            facultyMap.set(empId, { name: facultyData[empId].name, dept: facultyData[empId].dept });
          }
        }

        // Fetch attendance
        const attendanceSnap = await get(ref(db, 'attendance'));
        if (attendanceSnap.exists()) {
          const data = attendanceSnap.val();
          const flattened: AttendanceRecord[] = [];

          for (const empId in data) {
            const facultyDetails = facultyMap.get(empId) || { name: `Unknown (${empId})`, dept: 'Unknown' };
            const records = data[empId].records;

            if (records) {
              for (const date in records) {
                flattened.push({
                  id: `${date}-${empId}`,
                  empId: Number(empId),
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

          setAllData(flattened);
        }
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFileUpload = useCallback(
    (file: File, date: string) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        setUploadStatus(null);
        setLoading(true);

        try {
          const wb = XLSX.read(e.target?.result, { type: 'binary' });

          let allRecords: AttendanceRecord[] = [];
          for (const sheet of wb.SheetNames) {
            const ws = wb.Sheets[sheet];
            const jsonData = XLSX.utils.sheet_to_json(ws, { range: 1 });

            if (jsonData.length > 0) {
              allRecords.push(...processRawData(jsonData, date, settings.onTimeThreshold));
            }
          }

          if (allRecords.length === 0) throw new Error("No data found.");

          // Fetch faculty IDs for validation
          const facultySnap = await get(ref(db, 'faculty'));
          if (!facultySnap.exists()) throw new Error("No faculty found.");

          const validIds = new Set(Object.keys(facultySnap.val()));

          const valid: AttendanceRecord[] = [];
          const invalidIds = new Set<number>();

          allRecords.forEach((record) => {
            if (validIds.has(String(record.empId))) valid.push(record);
            else invalidIds.add(record.empId);
          });

          if (valid.length === 0)
            throw new Error(`Invalid Employee IDs: ${Array.from(invalidIds).join(', ')}`);

          // Build update object
          const updates: any = {};
          valid.forEach((record) => {
            updates[`attendance/${record.empId}/records/${record.date}`] = {
              inTime: record.inTime,
              status: record.status,
            };
          });

          await update(ref(db), updates);

          setUploadStatus({
            type: invalidIds.size > 0 ? 'warning' : 'success',
            message:
              invalidIds.size > 0
                ? `Uploaded ${valid.length} records. Skipped invalid IDs: ${Array.from(invalidIds).join(', ')}`
                : `Successfully uploaded ${valid.length} records.`,
          });

          // Update frontend state
          const facultyMap = facultySnap.val();
          setAllData((prev) => {
            const map = new Map(prev.map((d) => [d.id, d]));

            valid.forEach((rec) => {
              map.set(rec.id, {
                ...rec,
                name: facultyMap[rec.empId]?.name || `Unknown (${rec.empId})`,
                dept: facultyMap[rec.empId]?.dept || 'Unknown',
              });
            });

            return [...map.values()];
          });
        } catch (err: any) {
          console.error(err);
          setUploadStatus({
            type: 'error',
            message: err.message || 'Upload failed.',
          });
        } finally {
          setLoading(false);
        }
      };

      reader.readAsBinaryString(file);
    },
    [settings.onTimeThreshold]
  );

  // Filters and computed data remain unchanged...

  const departments = useMemo(() => {
    const depts = new Set(allData.map((d) => d.dept));
    return ['all', ...Array.from(depts)];
  }, [allData]);

  const filteredData = useMemo(() => {
    return allData.filter((record) => {
      return (
        record.date >= startDateFilter &&
        record.date <= endDateFilter &&
        (departmentFilter === 'all' || record.dept === departmentFilter) &&
        (!facultyNameFilter ||
          record.name.toLowerCase().includes(facultyNameFilter.toLowerCase()))
      );
    });
  }, [allData, startDateFilter, endDateFilter, departmentFilter, facultyNameFilter]);

  const stats = useMemo(() => {
    const unique = new Set(filteredData.map((d) => d.empId)).size;

    return {
      total: unique,
      onTime: filteredData.filter((d) => d.status === AttendanceStatus.OnTime).length,
      late: filteredData.filter((d) => d.status === AttendanceStatus.Late).length,
      absent: filteredData.filter((d) => d.status === AttendanceStatus.Absent).length,
      onDuty: filteredData.filter((d) => d.status === AttendanceStatus.OnDuty).length,
    };
  }, [filteredData]);

  return {
    allData,
    filteredData,
    error,
    loading,
    uploadStatus,
    clearUploadStatus: () => setUploadStatus(null),
    handleFileUpload,
    filters: { startDate: startDateFilter, endDate: endDateFilter, department: departmentFilter, facultyName: facultyNameFilter },
    setters: { setStartDateFilter, setEndDateFilter, setDepartmentFilter, setFacultyNameFilter },
    departments,
    stats,
    clearError: () => setError(null),
  };
};
