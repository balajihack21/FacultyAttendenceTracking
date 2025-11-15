import { useState, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../firebase/config';
import { FacultyRecord } from '../types';
import { ref, get, set, update } from "firebase/database";

const processRawFacultyData = (jsonData: any[]): FacultyRecord[] => {
  return jsonData.map((row, index) => {
    const normalizedRow: { [key: string]: any } = {};
    for (const key in row) {
      normalizedRow[key.toLowerCase().replace(/\s/g, '')] = row[key];
    }

    return {
      empId: parseInt(normalizedRow['empid'] || normalizedRow['emp.id'], 10) || index,
      name: normalizedRow['name'] || 'N/A',
      dept: normalizedRow['dept'] || 'N/A',
      designation: normalizedRow['designation'] || 'N/A',
      salary: parseFloat(normalizedRow['salary']) || 0,
      casualLeaves: parseInt(normalizedRow['casualleaves'], 10) || 0,
    };
  });
};

export const useFacultyData = () => {
  const [facultyList, setFacultyList] = useState<FacultyRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const facultySnap = await get(ref(db, 'faculty'));

      if (facultySnap.exists()) {
        const data = facultySnap.val();
        const loadedFaculty: FacultyRecord[] = Object.entries(data).map(
          ([empId, details]) => ({
            empId: parseInt(empId, 10),
            ...(details as Omit<FacultyRecord, 'empId'>),
          })
        );

        setFacultyList(loadedFaculty.sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        setFacultyList([]);
      }
    } catch (err) {
      console.error("Error fetching faculty data:", err);
      setError("Failed to load faculty data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ----------------------------------------------------------------
  // ADD Faculty
  // ----------------------------------------------------------------
  const addFaculty = useCallback(
    async (newFaculty: FacultyRecord) => {
      if (facultyList.some((f) => f.empId === newFaculty.empId)) {
        setError(`Faculty with Employee ID ${newFaculty.empId} already exists.`);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        await set(ref(db, `faculty/${newFaculty.empId}`), {
          name: newFaculty.name,
          dept: newFaculty.dept,
          designation: newFaculty.designation,
          salary: newFaculty.salary,
          casualLeaves: newFaculty.casualLeaves || 0,
        });

        setFacultyList((prev) =>
          [...prev, newFaculty].sort((a, b) => a.name.localeCompare(b.name))
        );
      } catch (err) {
        console.error(err);
        setError("Failed to add faculty member.");
      } finally {
        setLoading(false);
      }
    },
    [facultyList]
  );

  // ----------------------------------------------------------------
  // UPDATE Faculty
  // ----------------------------------------------------------------
  const updateFaculty = useCallback(async (empId: number, dataToUpdate: Omit<FacultyRecord, 'empId'>) => {
    setLoading(true);
    setError(null);

    try {
      await set(ref(db, `faculty/${empId}`), dataToUpdate);

      setFacultyList((prev) =>
        prev
          .map((f) => (f.empId === empId ? { empId, ...dataToUpdate } : f))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    } catch (err) {
      console.error(err);
      setError("Failed to update faculty member.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ----------------------------------------------------------------
  // DELETE Faculty
  // ----------------------------------------------------------------
  const deleteFaculty = useCallback(async (empId: number) => {
    setLoading(true);
    setError(null);

    try {
      const updates: Record<string, null> = {};
      updates[`faculty/${empId}`] = null;
      updates[`attendance/${empId}`] = null;

      await update(ref(db), updates);

      setFacultyList((prev) => prev.filter((f) => f.empId !== empId));
    } catch (err) {
      console.error("Failed to delete faculty:", err);
      setError("Failed to delete faculty member.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ----------------------------------------------------------------
  // FILE UPLOAD
  // ----------------------------------------------------------------
  const handleFileUpload = useCallback(
    (file: File) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          setLoading(true);
          setError(null);

          const data = e.target?.result;
          if (!data) throw new Error("File is empty");

          const workbook = XLSX.read(data, { type: 'binary' });
          let allProcessedData: FacultyRecord[] = [];

          for (const sheet of workbook.SheetNames) {
            const ws = workbook.Sheets[sheet];
            const jsonData = XLSX.utils.sheet_to_json(ws);
            if (jsonData.length > 0) {
              allProcessedData = allProcessedData.concat(processRawFacultyData(jsonData));
            }
          }

          if (allProcessedData.length === 0) {
            throw new Error("No data found in any sheets.");
          }

          const updates: Record<string, any> = {};

          allProcessedData.forEach((faculty) => {
            const { empId, ...rest } = faculty;
            updates[`faculty/${empId}`] = rest;
          });

          await update(ref(db), updates);

          await fetchData();
        } catch (err) {
          console.error(err);
          const msg = err instanceof Error ? err.message : "Unexpected error";
          setError(`File processing failed: ${msg}`);
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError("Failed to read file.");
        setLoading(false);
      };

      reader.readAsBinaryString(file);
    },
    [fetchData]
  );

  return {
    facultyList,
    error,
    loading,
    addFaculty,
    updateFaculty,
    deleteFaculty,
    handleFileUpload,
    clearError: () => setError(null),
  };
};
