import React, { useState, useMemo } from 'react';
import { useUserManagementData, UnifiedUser } from '../hooks/useUserManagementData';
import { useSettings } from './SettingsContext';
import { Loader2, UserCheck, UserX, AlertTriangle, RefreshCw, CheckCircle, ShieldCheck, Users, Search, KeyRound, Cog, UserCog, Trash2 } from 'lucide-react';

const UserManagementPage: React.FC = () => {
    const { pendingUsers, allUsers, loading, error, approveUser, rejectUser, changeUserPassword, deleteUser, refresh, clearError } = useUserManagementData();
    const { settings, updateSettings, loading: settingsLoading } = useSettings();
    const [actionState, setActionState] = useState<{ type: 'approving' | 'rejecting'; username: string } | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [isUpdatingSetting, setIsUpdatingSetting] = useState(false);
    const [activeTab, setActiveTab] = useState<'manageUsers' | 'approvals' | 'settings'>('manageUsers');

    const [userSearchQuery, setUserSearchQuery] = useState('');
    
    const [passwordModalUser, setPasswordModalUser] = useState<UnifiedUser | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const [deleteModalUser, setDeleteModalUser] = useState<UnifiedUser | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);


    const handleApprove = async (user: {username: string, password?: string}) => {
        setActionState({ type: 'approving', username: user.username });
        setFeedback(null);
        clearError();
        try {
            await approveUser(user);
            setFeedback({ type: 'success', message: `User '${user.username}' has been approved.` });
        } catch (err) {
            setFeedback({ type: 'error', message: `Failed to approve '${user.username}'.` });
        } finally {
            setActionState(null);
        }
    };

    const handleReject = async (username: string) => {
        if (!window.confirm(`Are you sure you want to reject the user '${username}'? This action cannot be undone.`)) {
            return;
        }
        setActionState({ type: 'rejecting', username });
        setFeedback(null);
        clearError();
        try {
            await rejectUser(username);
            setFeedback({ type: 'success', message: `User '${username}' has been rejected.` });
        } catch (err) {
            setFeedback({ type: 'error', message: `Failed to reject '${username}'.` });
        } finally {
            setActionState(null);
        }
    };
    
    const handleToggleAccountCreation = async () => {
        setIsUpdatingSetting(true);
        try {
            await updateSettings({
                ...settings,
                accountCreationEnabled: !settings.accountCreationEnabled
            });
        } catch (e) { /* Error handled in context */ } finally {
            setIsUpdatingSetting(false);
        }
    };

    const handleToggleUserAccountRequest = async () => {
        setIsUpdatingSetting(true);
        try {
            await updateSettings({
                ...settings,
                userAccountRequestEnabled: !settings.userAccountRequestEnabled
            });
        } catch (e) { /* Error handled in context */ } finally {
            setIsUpdatingSetting(false);
        }
    };

    const handlePasswordModalOpen = (user: UnifiedUser) => {
        setPasswordModalUser(user);
        setNewPassword('');
        setConfirmNewPassword('');
        setFeedback(null);
        clearError();
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passwordModalUser || !newPassword) return;
        if (newPassword !== confirmNewPassword) {
            setFeedback({ type: 'error', message: 'New passwords do not match.' });
            return;
        }

        setIsChangingPassword(true);
        setFeedback(null);
        clearError();
        try {
            await changeUserPassword(passwordModalUser.username, newPassword);
            setFeedback({ type: 'success', message: `Password for '${passwordModalUser.username}' has been updated.` });
            setPasswordModalUser(null);
        } catch (err) {
            setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to change password.' });
        } finally {
            setIsChangingPassword(false);
        }
    };
    
    const handleDeleteModalOpen = (user: UnifiedUser) => {
        setDeleteModalUser(user);
        setFeedback(null);
        clearError();
    };

    const handleConfirmDelete = async () => {
        if (!deleteModalUser) return;
        setIsDeleting(true);
        setFeedback(null);
        clearError();
        try {
            await deleteUser(deleteModalUser);
            setFeedback({ type: 'success', message: `Account for ${deleteModalUser.name || deleteModalUser.username} has been successfully ${deleteModalUser.role === 'faculty' ? 'reset' : 'deleted'}.` });
            setDeleteModalUser(null);
        } catch (err) {
            setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to process request.' });
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredUsers = useMemo(() => {
        if (!userSearchQuery) return allUsers;
        const query = userSearchQuery.toLowerCase();
        return allUsers.filter(u => 
            u.username.toLowerCase().includes(query) ||
            (u.name && u.name.toLowerCase().includes(query))
        );
    }, [userSearchQuery, allUsers]);

    const ToggleSwitch: React.FC<{ enabled: boolean; onToggle: () => void; disabled?: boolean }> = ({ enabled, onToggle, disabled }) => (
        <button type="button" role="switch" aria-checked={enabled} onClick={onToggle} disabled={disabled}
            className={`${enabled ? 'bg-highlight' : 'bg-gray-300 dark:bg-gray-600'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-highlight dark:focus:ring-offset-gray-800`}>
            <span className={`${enabled ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}/>
        </button>
    );

    const TabButton: React.FC<{ tabName: typeof activeTab; children: React.ReactNode; }> = ({ tabName, children }) => (
        <button
          onClick={() => setActiveTab(tabName)}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === tabName
              ? 'bg-highlight text-primary dark:bg-teal-500 dark:text-gray-100'
              : 'text-text-secondary hover:bg-accent hover:text-text-primary dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
          }`}
        >{children}</button>
    );

    const tabTitles = { approvals: 'Pending Approval Requests', manageUsers: 'Manage All Users', settings: 'Registration Settings' };
    const tabDescriptions = { approvals: 'Approve or reject new user accounts.', manageUsers: 'View, edit, and remove all existing users.', settings: 'Control whether new users can register.' };

    const renderContent = () => {
        if (error && !feedback) {
            return (
                 <div className="mb-4 bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center dark:bg-red-900/50 dark:border-red-700 dark:text-red-300" role="alert">
                    <strong className="font-bold mr-2">Error:</strong><span className="block sm:inline">{error}</span>
                    <button onClick={clearError} className="absolute top-0 bottom-0 right-0 px-4 py-3"><span className="text-2xl">&times;</span></button>
                </div>
            );
        }

        switch (activeTab) {
            case 'approvals':
                return loading ? ( <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-highlight" /></div> )
                : pendingUsers.length === 0 ? (
                    <div className="text-center py-10 px-6 bg-primary rounded-lg dark:bg-gray-900/50">
                        <Users className="mx-auto h-12 w-12 text-highlight dark:text-teal-300" />
                        <h3 className="mt-4 text-xl font-semibold text-text-primary dark:text-gray-200">No Pending Requests</h3>
                        <p className="mt-1 text-text-secondary dark:text-gray-400">There are currently no new user accounts awaiting approval.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pendingUsers.map(user => {
                            const isActing = actionState?.username === user.username;
                            return (
                                <div key={user.username} className="bg-primary dark:bg-gray-900/80 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <p className="font-semibold text-text-primary dark:text-gray-200">{user.username}</p>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleApprove(user)} disabled={isActing} className="w-28 flex justify-center items-center gap-2 px-3 py-1 text-sm rounded-md bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-400 transition-colors">
                                            {isActing && actionState.type === 'approving' ? <Loader2 className="h-4 w-4 animate-spin"/> : <><UserCheck size={16}/> Approve</>}
                                        </button>
                                        <button onClick={() => handleReject(user.username)} disabled={isActing} className="w-28 flex justify-center items-center gap-2 px-3 py-1 text-sm rounded-md bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-400 transition-colors">
                                            {isActing && actionState.type === 'rejecting' ? <Loader2 className="h-4 w-4 animate-spin"/> : <><UserX size={16}/> Reject</>}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            case 'manageUsers':
                return (
                    <div className="space-y-4">
                        <div className="relative max-w-sm">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary dark:text-gray-400" />
                            <input type="text" value={userSearchQuery} onChange={e => setUserSearchQuery(e.target.value)} placeholder="Search by name or username..."
                                className="w-full bg-primary border border-accent rounded-md p-2 pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"/>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-accent dark:divide-gray-700">
                                <thead className="bg-primary dark:bg-gray-900">
                                    <tr>
                                        <th className="p-3 text-left font-semibold text-text-secondary tracking-wider dark:text-gray-400">Username</th>
                                        <th className="p-3 text-left font-semibold text-text-secondary tracking-wider dark:text-gray-400">Name</th>
                                        <th className="p-3 text-left font-semibold text-text-secondary tracking-wider dark:text-gray-400">Role</th>
                                        <th className="p-3 text-left font-semibold text-text-secondary tracking-wider dark:text-gray-400">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-secondary divide-y divide-accent dark:bg-gray-800 dark:divide-gray-700">
                                    {loading && (<tr><td colSpan={4}><div className="flex justify-center p-4"><Loader2 className="animate-spin text-highlight" /></div></td></tr>)}
                                    {!loading && filteredUsers.map(user => (
                                        <tr key={user.username} className="hover:bg-accent transition-colors duration-150 dark:hover:bg-gray-700">
                                            <td className="p-3 text-sm font-medium text-text-primary dark:text-gray-300">{user.username}</td>
                                            <td className="p-3 text-sm text-text-primary dark:text-gray-300">{user.name || 'N/A'}</td>
                                            <td className="p-3 text-sm text-text-primary dark:text-gray-300">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/70 dark:text-indigo-300' : 'bg-teal-100 text-teal-800 dark:bg-teal-900/70 dark:text-teal-300'}`}>
                                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                </span>
                                            </td>
                                            <td className="p-3 text-sm text-text-primary dark:text-gray-300 flex items-center gap-2">
                                                <button onClick={() => handlePasswordModalOpen(user)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors dark:text-blue-400 dark:hover:bg-blue-900/50" aria-label={`Change password for ${user.username}`}>
                                                    <KeyRound size={16} />
                                                </button>
                                                <button onClick={() => handleDeleteModalOpen(user)} className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors dark:text-red-400 dark:hover:bg-red-900/50" aria-label={`Delete ${user.username}`}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {!loading && filteredUsers.length === 0 && <tr><td colSpan={4} className="text-center p-4 text-text-secondary dark:text-gray-400">No users found.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'settings':
                return (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                <h4 className="font-semibold text-text-primary dark:text-gray-200">Enable Faculty Registration</h4>
                                <p className="text-sm text-text-secondary dark:text-gray-400">Allow new faculty members to create an account from the login page.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {(settingsLoading || isUpdatingSetting) && <Loader2 className="h-5 w-5 animate-spin text-highlight" />}
                                <ToggleSwitch enabled={settings.accountCreationEnabled} onToggle={handleToggleAccountCreation} disabled={settingsLoading || isUpdatingSetting}/>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-accent dark:border-gray-700/50">
                            <div>
                                <h4 className="font-semibold text-text-primary dark:text-gray-200">Enable User Account Requests</h4>
                                <p className="text-sm text-text-secondary dark:text-gray-400">Allow non-faculty users to request an account from the login page.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {(settingsLoading || isUpdatingSetting) && <Loader2 className="h-5 w-5 animate-spin text-highlight" />}
                                <ToggleSwitch enabled={settings.userAccountRequestEnabled} onToggle={handleToggleUserAccountRequest} disabled={settingsLoading || isUpdatingSetting}/>
                            </div>
                        </div>
                    </div>
                );
            default: return null;
        }
    }

    return (
        <>
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="bg-secondary p-6 sm:p-8 rounded-lg shadow-xl dark:bg-gray-800">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-semibold text-highlight dark:text-teal-300 flex items-center gap-3"><ShieldCheck size={28} /> User Account Management</h2>
                            <p className="mt-1 text-text-secondary dark:text-gray-400">{tabDescriptions[activeTab]}</p>
                        </div>
                        <button onClick={refresh} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors text-text-secondary hover:bg-accent hover:text-text-primary dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:opacity-50">
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                        </button>
                    </div>
                    
                    <nav className="w-full flex flex-wrap items-center gap-2 bg-primary dark:bg-gray-900/50 p-1 rounded-lg mb-6">
                        <TabButton tabName="manageUsers"><UserCog size={16}/> Manage Users</TabButton>
                        <TabButton tabName="approvals"><UserCheck size={16}/> Approvals</TabButton>
                        <TabButton tabName="settings"><Cog size={16}/> Settings</TabButton>
                    </nav>

                    <div className="border-t border-accent dark:border-gray-700 pt-6">
                        <h3 className="text-xl font-semibold text-text-primary dark:text-gray-200 mb-4">{tabTitles[activeTab]}</h3>
                        {feedback && (
                            <div className={`mb-4 p-4 rounded-md text-sm flex items-start gap-3 ${feedback.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-300'}`}>
                                {feedback.type === 'success' ? <CheckCircle className="h-5 w-5 mt-0.5"/> : <AlertTriangle className="h-5 w-5 mt-0.5"/>}
                                {feedback.message}
                            </div>
                        )}
                        {renderContent()}
                    </div>
                </div>
            </div>

            {passwordModalUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <form onSubmit={handlePasswordChange} className="bg-secondary dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-accent dark:border-gray-700">
                           <h3 className="text-lg font-medium text-text-primary dark:text-gray-100">Change Password for {passwordModalUser.username}</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {feedback?.type === 'error' && <p className="text-sm text-red-600 dark:text-red-400">{feedback.message}</p>}
                             <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-gray-400">New Password</label>
                                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="Enter new password"
                                    className="w-full bg-primary border border-accent rounded-md p-2 mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-gray-400">Confirm New Password</label>
                                <input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} required placeholder="Confirm new password"
                                    className="w-full bg-primary border border-accent rounded-md p-2 mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"/>
                            </div>
                        </div>
                        <div className="bg-accent dark:bg-gray-700/50 px-6 py-3 flex justify-end gap-3 rounded-b-lg">
                            <button type="button" onClick={() => setPasswordModalUser(null)} className="px-4 py-2 text-sm rounded-md hover:bg-accent dark:hover:bg-gray-600">Cancel</button>
                            <button type="submit" disabled={isChangingPassword} className="w-auto flex justify-center items-center gap-2 bg-highlight text-primary font-bold py-2 px-4 rounded-md hover:bg-teal-300 disabled:bg-gray-500">
                                {isChangingPassword ? <><Loader2 className="h-5 w-5 animate-spin"/> Updating...</> : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {deleteModalUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-secondary dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                                </div>
                                <div className="mt-0 text-center sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-text-primary dark:text-gray-100">
                                    {deleteModalUser.role === 'faculty' ? 'Reset Faculty Account' : 'Delete User'}
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-text-secondary dark:text-gray-400">
                                        Are you sure? This will{' '}
                                        {deleteModalUser.role === 'faculty' ? (
                                            <>
                                                reset the account for{' '}
                                                <strong className="dark:text-gray-200">{deleteModalUser.name}</strong>,
                                                allowing them to register again.
                                            </>
                                        ) : (
                                            <>
                                                permanently delete the user{' '}
                                                <strong className="dark:text-gray-200">{deleteModalUser.username}</strong>.
                                            </>
                                        )}{' '}
                                        This action cannot be undone.
                                    </p>
                                </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-accent dark:bg-gray-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                            <button type="button" disabled={isDeleting} onClick={handleConfirmDelete}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-500">
                                {isDeleting ? 'Processing...' : 'Confirm'}
                            </button>
                            <button type="button" onClick={() => setDeleteModalUser(null)}
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserManagementPage;