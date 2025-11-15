import { useState, useCallback, useEffect } from 'react';
import { db } from '../firebase/config';
import { Holiday } from '../types';
import { ref, get, set, update, remove } from "firebase/database";

export const useHolidays = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // --- FETCH HOLIDAYS ---
  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
        const holidaysRef = ref(db, 'holidays');
        const snapshot = await get(holidaysRef);

        if (snapshot.exists()) {
            const dataFromDb = snapshot.val();
            const loadedHolidays: Holiday[] = Object.entries(dataFromDb).map(
                ([id, details]) => ({
                    id,
                    ...(details as Omit<Holiday, "id">),
                })
            );

            setHolidays(loadedHolidays.sort((a, b) => a.date.localeCompare(b.date)));
        } else {
            setHolidays([]);
        }
    } catch (err) {
        console.error("Error fetching holiday data:", err);
        setError("Failed to load holiday data.");
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  // --- ADD HOLIDAY ---
  const addHoliday = useCallback(
    async (newHoliday: Omit<Holiday, "id">) => {
      setError(null);

      const holidayId = newHoliday.date; // date used as unique key
      if (holidays.some((h) => h.id === holidayId)) {
        const msg = `A holiday for the date ${holidayId} already exists.`;
        setError(msg);
        throw new Error(msg);
      }

      try {
        const holidayRef = ref(db, `holidays/${holidayId}`);
        await set(holidayRef, newHoliday);

        setHolidays((prev) =>
          [...prev, { id: holidayId, ...newHoliday }].sort((a, b) =>
            a.date.localeCompare(b.date)
          )
        );
      } catch (err) {
        console.error(err);
        setError("Failed to add holiday.");
        throw err;
      }
    },
    [holidays]
  );

  // --- UPDATE HOLIDAY ---
  const updateHoliday = useCallback(
    async (holidayId: string, dataToUpdate: Omit<Holiday, "id" | "date">) => {
      setError(null);

      try {
        const holidayRef = ref(db, `holidays/${holidayId}`);
        await update(holidayRef, dataToUpdate);

        setHolidays((prev) =>
          prev
            .map((holiday) =>
              holiday.id === holidayId
                ? { ...holiday, ...dataToUpdate }
                : holiday
            )
            .sort((a, b) => a.date.localeCompare(b.date))
        );
      } catch (err) {
        console.error(err);
        setError("Failed to update holiday.");
        throw err;
      }
    },
    []
  );

  // --- DELETE HOLIDAY ---
  const deleteHoliday = useCallback(async (holidayId: string) => {
    setError(null);

    try {
      const holidayRef = ref(db, `holidays/${holidayId}`);
      await remove(holidayRef);

      setHolidays((prev) => prev.filter((h) => h.id !== holidayId));
    } catch (err) {
      console.error("Failed to delete holiday:", err);
      setError("Failed to delete holiday.");
      throw err;
    }
  }, []);

  return {
    holidays,
    error,
    loading,
    addHoliday,
    updateHoliday,
    deleteHoliday,
    clearError: () => setError(null),
  };
};
