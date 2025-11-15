import { useState, useCallback, useEffect } from 'react';
import { db } from '../firebase/config';
import { FacultyRecord } from '../types';
import { ref, get, set, remove, update, query, orderByChild, equalTo } from "firebase/database";

interface UserAccount {
  username: string;
  password?: string;
}

export interface UnifiedUser {
  username: string;
  name?: string;
  empId?: number;
  role: 'admin' | 'faculty';
}

const encodeEmailForKey = (email: string) => email.replace(/\./g, ',');

export const useUserManagementData = () => {
  const [pendingUsers, setPendingUsers] = useState<UserAccount[]>([]);
  const [allUsers, setAllUsers] = useState<UnifiedUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // -------------------------------------------------------------
  // FETCH USERS (pending, faculty registered users, admins)
  // -------------------------------------------------------------
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const pendingRef = ref(db, 'pendingUsers');
      const facultyRef = ref(db, 'faculty');
      const usersRef = ref(db, 'users');

      const [pendingSnapshot, facultySnapshot, usersSnapshot] = await Promise.all([
        get(pendingRef),
        get(facultyRef),
        get(usersRef),
      ]);

      // -------------------------------
      // Pending users
      // -------------------------------
      if (pendingSnapshot.exists()) {
        setPendingUsers(Object.values(pendingSnapshot.val()));
      } else {
        setPendingUsers([]);
      }

      // -------------------------------
      // Build unified user list
      // -------------------------------
      const combinedUsers: UnifiedUser[] = [];

      // Faculty accounts
      if (facultySnapshot.exists()) {
        const facultyData = facultySnapshot.val();

        Object.keys(facultyData).forEach(empId => {
          const faculty: FacultyRecord = {
            empId: parseInt(empId),
            ...facultyData[empId]
          };

          if (faculty.registered && faculty.username) {
            combinedUsers.push({
              username: faculty.username,
              name: faculty.name,
              empId: faculty.empId,
              role: 'faculty',
            });
          }
        });
      }

      // Admin accounts
      if (usersSnapshot.exists()) {
        const usersData = usersSnapshot.val();
        Object.values(usersData).forEach((user: any) => {
          if (user?.username) {
            combinedUsers.push({
              username: user.username,
              name: 'N/A',
              role: 'admin',
            });
          }
        });
      }

      setAllUsers(combinedUsers.sort((a, b) => a.username.localeCompare(b.username)));

    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load user data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // -------------------------------------------------------------
  // APPROVE USER
  // -------------------------------------------------------------
  const approveUser = useCallback(async (user: UserAccount) => {
    setError(null);
    try {
      const encoded = encodeEmailForKey(user.username);

      const userRef = ref(db, `users/${encoded}`);
      const pendingRef = ref(db, `pendingUsers/${encoded}`);

      await set(userRef, {
        username: user.username,
        password: user.password,
      });

      await remove(pendingRef);
      await fetchUsers();

    } catch (err) {
      console.error("Error approving user:", err);
      setError("Failed to approve user. Please try again.");
      throw err;
    }
  }, [fetchUsers]);

  // -------------------------------------------------------------
  // REJECT USER
  // -------------------------------------------------------------
  const rejectUser = useCallback(async (username: string) => {
    setError(null);

    try {
      const encoded = encodeEmailForKey(username);
      await remove(ref(db, `pendingUsers/${encoded}`));

      setPendingUsers(prev => prev.filter(u => u.username !== username));

    } catch (err) {
      console.error("Failed to reject user:", err);
      setError("Failed to reject user. Please try again.");
      throw err;
    }
  }, []);

  // -------------------------------------------------------------
  // CHANGE PASSWORD (admin or faculty)
  // -------------------------------------------------------------
  const changeUserPassword = useCallback(async (username: string, newPassword: string) => {
    setError(null);

    try {
      const encoded = encodeEmailForKey(username);
      const userRef = ref(db, `users/${encoded}`);
      const userSnapshot = await get(userRef);

      // Case 1: Admin user
      if (userSnapshot.exists()) {
        await update(userRef, { password: btoa(newPassword) });
        return;
      }

      // Case 2: Faculty user
      const facultyQuery = query(
        ref(db, 'faculty'),
        orderByChild('username'),
        equalTo(username)
      );

      const facultySnapshot = await get(facultyQuery);

      if (!facultySnapshot.exists()) {
        throw new Error(`User '${username}' not found.`);
      }

      const empId = Object.keys(facultySnapshot.val())[0];
      const facultyRef = ref(db, `faculty/${empId}`);

      await update(facultyRef, { password: btoa(newPassword) });

    } catch (err: any) {
      console.error("Error changing password:", err);
      const msg = err?.message || "Failed to change password.";
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  // -------------------------------------------------------------
  // DELETE USER (admin or faculty)
  // -------------------------------------------------------------
  const deleteUser = useCallback(async (user: UnifiedUser) => {
    setError(null);

    try {
      if (user.role === "faculty" && user.empId) {
        await update(ref(db, `faculty/${user.empId}`), {
          username: null,
          password: null,
          registered: null,
        });
      }
      else if (user.role === "admin") {
        const encoded = encodeEmailForKey(user.username);
        await remove(ref(db, `users/${encoded}`));
      }
      else {
        throw new Error("Invalid user type for deletion.");
      }

      await fetchUsers();

    } catch (err) {
      console.error("Error deleting user:", err);
      const msg = "Failed to process request. Please try again.";
      setError(msg);
      throw new Error(msg);
    }
  }, [fetchUsers]);

  // -------------------------------------------------------------
  return {
    pendingUsers,
    allUsers,
    error,
    loading,
    approveUser,
    rejectUser,
    changeUserPassword,
    deleteUser,
    refresh: fetchUsers,
    clearError: () => setError(null),
  };
};
