import { useState, useCallback, useEffect } from 'react';
import { db } from '../firebase/config';
import { LeaveApplicationRecord } from '../types';
import { ref, get, update } from "firebase/database";

export const useLeaveApprovalData = () => {
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplicationRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // --- FETCH LEAVE APPLICATIONS ---
  const fetchLeaveApplications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const leaveRef = ref(db, "leaveApplications");
      const snapshot = await get(leaveRef);

      if (snapshot.exists()) {
        const dataFromDb = snapshot.val();
        const loadedLeaves: LeaveApplicationRecord[] = Object.values(dataFromDb);

        setLeaveApplications(
          loadedLeaves.sort((a, b) =>
            b.submissionTimestamp.localeCompare(a.submissionTimestamp)
          )
        );
      } else {
        setLeaveApplications([]);
      }
    } catch (err) {
      console.error("Error fetching leave applications:", err);
      setError("Failed to load leave application data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaveApplications();
  }, [fetchLeaveApplications]);

  // --- APPROVE LEAVE ---
  const approveLeave = useCallback(
    async (leaveId: string) => {
      const originalApplications = [...leaveApplications];

      // Optimistic UI update
      setLeaveApplications((prev) =>
        prev.map((app) =>
          app.id === leaveId ? { ...app, status: "Approved" } : app
        )
      );

      try {
        const leaveRef = ref(db, `leaveApplications/${leaveId}`);
        await update(leaveRef, { status: "Approved" });
      } catch (err) {
        setLeaveApplications(originalApplications);
        console.error("Failed to approve leave:", err);
        throw new Error("Failed to approve leave. Please try again.");
      }
    },
    [leaveApplications]
  );

  // --- REJECT LEAVE ---
  const rejectLeave = useCallback(
    async (leaveId: string) => {
      const originalApplications = [...leaveApplications];

      // Optimistically update UI
      setLeaveApplications((prev) =>
        prev.map((app) =>
          app.id === leaveId ? { ...app, status: "Rejected" } : app
        )
      );

      try {
        const leaveApp = originalApplications.find((app) => app.id === leaveId);
        if (!leaveApp) {
          throw new Error("Leave application not found.");
        }

        const updates: { [key: string]: any } = {};

        // Update leave status
        updates[`leaveApplications/${leaveId}/status`] = "Rejected";

        // Remove attendance entries linked to the leave
        const startParts = leaveApp.startDate.split("-").map(Number);
        const endParts = leaveApp.endDate.split("-").map(Number);

        let current = new Date(Date.UTC(startParts[0], startParts[1] - 1, startParts[2]));
        const last = new Date(Date.UTC(endParts[0], endParts[1] - 1, endParts[2]));

        while (current <= last) {
          const dateString = current.toISOString().split("T")[0];
          updates[`attendance/${leaveApp.empId}/records/${dateString}`] = null;
          current.setUTCDate(current.getUTCDate() + 1);
        }

        // Perform full DB update
        await update(ref(db), updates);
      } catch (err) {
        setLeaveApplications(originalApplications);
        console.error("Failed to reject leave:", err);
        throw new Error("Failed to reject leave. Please try again.");
      }
    },
    [leaveApplications]
  );

  return {
    leaveApplications,
    error,
    loading,
    approveLeave,
    rejectLeave,
    refresh: fetchLeaveApplications,
    clearError: () => setError(null),
  };
};
