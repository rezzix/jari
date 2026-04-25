import { useState, type FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { updateUser, changePassword } from '@/api/users';
import Spinner from '@/components/common/Spinner';

export default function ProfilePage() {
  const { user, updateUser: updateUserStore } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setProfileMsg(null);
    setProfileError(null);
    try {
      const updated = await updateUser(user.id, { firstName, lastName, email });
      updateUserStore(updated);
      setProfileMsg('Profile updated successfully.');
    } catch {
      setProfileError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    setPasswordMsg(null);
    setPasswordError(null);
    try {
      await changePassword(user.id, {
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg('Password changed successfully.');
    } catch {
      setPasswordError('Failed to change password. Check your current password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Profile</h2>

      {/* Profile edit */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={user.username}
              disabled
              className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <input
              type="text"
              value={user.role}
              disabled
              className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-500 cursor-not-allowed"
            />
          </div>

          {profileMsg && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2">{profileMsg}</div>}
          {profileError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{profileError}</div>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Spinner className="h-4 w-4" />}
              Save changes
            </button>
          </div>
        </form>
      </div>

      {/* Password change */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Current password
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {passwordMsg && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2">{passwordMsg}</div>}
          {passwordError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{passwordError}</div>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordSaving}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2"
            >
              {passwordSaving && <Spinner className="h-4 w-4" />}
              Change password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}