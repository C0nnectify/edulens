'use client';

/**
 * Admin - User Management Page
 * 
 * View, update, and delete users from the database.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit2,
  Eye,
  Shield,
  ShieldAlert,
  RefreshCw,
  X,
  Check,
  AlertTriangle,
  Database,
  Activity,
  UserPlus,
  FileText,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  image?: string;
  createdAt: string;
  updatedAt: string;
  hasProfile: boolean;
  hasSmartProfile: boolean;
  profileCompleteness: number;
  activeSessions: number;
}

interface UserDetails {
  user: User;
  profile: {
    id: string;
    createdFromDream: boolean;
    overallProgress: number;
    currentStageIndex: number;
    createdAt: string;
    updatedAt: string;
  } | null;
  smartProfile: {
    id: string;
    version: number;
    profileCompleteness: number;
    createdAt: string;
    updatedAt: string;
  } | null;
  roadmap: {
    id: string;
    targetSeason: string;
    createdAt: string;
  } | null;
  stats: {
    activeSessions: number;
    documentsCount: number;
  };
  sessions: {
    id: string;
    createdAt: string;
    expiresAt: string;
    userAgent?: string;
    ipAddress?: string;
  }[];
}

interface Stats {
  collections: Record<string, number>;
  usersByRole: Record<string, number>;
  overview: {
    totalUsers: number;
    recentSignups: number;
    activeSessions: number;
    usersWithProfiles: number;
    usersWithSmartProfiles: number;
    totalDocuments: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      const response = await fetch(`/api/admin/users?${params}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('Access denied. Admin privileges required.');
        } else {
          setError('Failed to fetch users');
        }
        return;
      }

      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search]);

  // Fetch user details
  const fetchUserDetails = async (userId: string) => {
    setIsModalLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedUser(data);
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    } finally {
      setIsModalLoading(false);
    }
  };

  // Update user
  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    setIsModalLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setEditingUser(null);
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update user');
      }
    } catch {
      alert('Failed to update user');
    } finally {
      setIsModalLoading(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    setIsModalLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeletingUser(null);
        fetchUsers();
        fetchStats();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch {
      alert('Failed to delete user');
    } finally {
      setIsModalLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination(prev => ({ ...prev, page: 1 }));
      } else {
        fetchUsers();
      }
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  if (error === 'Access denied. Admin privileges required.') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="text-center">
          <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-6">You need admin privileges to access this page.</p>
          <Link
            href="/admin"
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">User Management</h1>
                  <p className="text-sm text-slate-400">View, edit, and manage users</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => { fetchUsers(); fetchStats(); }}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <StatCard
              label="Total Users"
              value={stats.overview.totalUsers}
              icon={Users}
              color="blue"
            />
            <StatCard
              label="Recent Signups"
              value={stats.overview.recentSignups}
              icon={UserPlus}
              color="green"
              subtitle="Last 7 days"
            />
            <StatCard
              label="Active Sessions"
              value={stats.overview.activeSessions}
              icon={Activity}
              color="purple"
            />
            <StatCard
              label="With Profiles"
              value={stats.overview.usersWithProfiles}
              icon={FileText}
              color="cyan"
            />
            <StatCard
              label="Documents"
              value={stats.overview.totalDocuments}
              icon={Database}
              color="orange"
            />
            <StatCard
              label="Admins"
              value={stats.usersByRole.admin || 0}
              icon={Shield}
              color="red"
            />
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-800/50 rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">User</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Profile</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Sessions</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Created</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                            {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium">{user.name || 'No name'}</p>
                            <p className="text-sm text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-slate-700/50 text-slate-300'
                        }`}>
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                              style={{ width: `${user.profileCompleteness}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400">{user.profileCompleteness}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-300">{user.activeSessions}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-400 text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => fetchUserDetails(user.id)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Edit user"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingUser(user)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
                {pagination.totalCount} users
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-slate-300">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View User Modal */}
      <AnimatePresence>
        {selectedUser && (
          <Modal onClose={() => setSelectedUser(null)}>
            <div className="max-w-2xl w-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">User Details</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isModalLoading ? (
                <div className="py-12 text-center">
                  <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* User Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {selectedUser.user.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{selectedUser.user.name || 'No name'}</h3>
                      <p className="text-slate-400">{selectedUser.user.email}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        selectedUser.user.role === 'admin'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-slate-700/50 text-slate-300'
                      }`}>
                        {selectedUser.user.role || 'user'}
                      </span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-xs text-slate-400 mb-1">Sessions</p>
                      <p className="text-xl font-bold text-white">{selectedUser.stats.activeSessions}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-xs text-slate-400 mb-1">Documents</p>
                      <p className="text-xl font-bold text-white">{selectedUser.stats.documentsCount}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-xs text-slate-400 mb-1">Profile</p>
                      <p className="text-xl font-bold text-white">
                        {selectedUser.smartProfile?.profileCompleteness || selectedUser.profile?.overallProgress || 0}%
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-xs text-slate-400 mb-1">Joined</p>
                      <p className="text-sm font-medium text-white">
                        {new Date(selectedUser.user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Profile Details */}
                  {(selectedUser.profile || selectedUser.smartProfile) && (
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <h4 className="text-sm font-medium text-slate-300 mb-3">Profile Information</h4>
                      <div className="space-y-2 text-sm">
                        {selectedUser.smartProfile && (
                          <>
                            <p className="text-slate-400">
                              SmartProfile v{selectedUser.smartProfile.version}
                            </p>
                            <p className="text-slate-400">
                              Last updated: {new Date(selectedUser.smartProfile.updatedAt).toLocaleString()}
                            </p>
                          </>
                        )}
                        {selectedUser.profile && (
                          <>
                            <p className="text-slate-400">
                              Created from Dream: {selectedUser.profile.createdFromDream ? 'Yes' : 'No'}
                            </p>
                            <p className="text-slate-400">
                              Current Stage: {selectedUser.profile.currentStageIndex}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sessions */}
                  {selectedUser.sessions.length > 0 && (
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <h4 className="text-sm font-medium text-slate-300 mb-3">Active Sessions</h4>
                      <div className="space-y-2">
                        {selectedUser.sessions.slice(0, 5).map((session) => (
                          <div key={session.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-500" />
                              <span className="text-slate-400">
                                {session.ipAddress || 'Unknown IP'}
                              </span>
                            </div>
                            <span className="text-slate-500">
                              Expires: {new Date(session.expiresAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <Modal onClose={() => setEditingUser(null)}>
            <EditUserForm
              user={editingUser}
              isLoading={isModalLoading}
              onSave={(updates) => handleUpdateUser(editingUser.id, updates)}
              onCancel={() => setEditingUser(null)}
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingUser && (
          <Modal onClose={() => setDeletingUser(null)}>
            <div className="max-w-md w-full text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Delete User?</h2>
              <p className="text-slate-400 mb-6">
                Are you sure you want to delete <span className="text-white">{deletingUser.email}</span>?
                This will also delete all their profiles, documents, and sessions.
                This action cannot be undone.
              </p>
              <div className="flex items-center gap-3 justify-center">
                <button
                  onClick={() => setDeletingUser(null)}
                  disabled={isModalLoading}
                  className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteUser(deletingUser.id)}
                  disabled={isModalLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  {isModalLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete User
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    cyan: 'from-cyan-500 to-cyan-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-8 h-8 bg-gradient-to-br ${colorMap[color]} rounded-lg flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
      <p className="text-xs text-slate-400">{label}</p>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}

// Modal Component
function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-900 rounded-2xl border border-white/10 p-6 max-h-[90vh] overflow-y-auto"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// Edit User Form Component
function EditUserForm({
  user,
  isLoading,
  onSave,
  onCancel,
}: {
  user: User;
  isLoading: boolean;
  onSave: (updates: Partial<User>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role || 'user');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, email, role });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Edit User</h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-slate-400 hover:text-white rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            placeholder="Enter name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            placeholder="Enter email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-4 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </div>
    </form>
  );
}
