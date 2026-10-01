import { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2, User, KeyRound, Clock, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { compressImageUnderLimit } from '../../lib/imageCompression';

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

function ProfileSection({ profile, email, userId, onProfileUpdate }) {
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'password' | 'timezone'

  // Personal info form state (email removed as it's unchangeable)
  const [personalData, setPersonalData] = useState({
    username: profile?.username || '',
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    password: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Timezone state with free API dropdown
  const [selectedTimezone, setSelectedTimezone] = useState(profile?.timezone || 'UTC');
  const [timezoneList, setTimezoneList] = useState([]);
  const [isLoadingTimezones, setIsLoadingTimezones] = useState(false);

  // Status & feedback indicators
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState({ text: '', type: '' });

  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [personalMessage, setPersonalMessage] = useState({ text: '', type: '' });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });

  const [isSavingTimezone, setIsSavingTimezone] = useState(false);
  const [timezoneMessage, setTimezoneMessage] = useState({ text: '', type: '' });

  const fileInputRef = useRef(null);

  // Sync state if profile prop changes
  useEffect(() => {
    if (profile) {
      setPersonalData({
        username: profile.username || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
      });
      setSelectedTimezone(profile.timezone || 'UTC');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  // Fetch available timezones using free API with browser fallback
  useEffect(() => {
    let isMounted = true;
    async function fetchTimezones() {
      setIsLoadingTimezones(true);
      try {
        const res = await fetch('https://timeapi.io/api/timezone/availabletimezones');
        if (!res.ok) throw new Error('Failed to load timezones from API');
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0 && isMounted) {
          setTimezoneList(list);
          return;
        }
      } catch {
        // Fallback to Intl API if network API is unavailable
      }

      if (isMounted) {
        if (typeof Intl !== 'undefined' && Intl.supportedValuesOf) {
          setTimezoneList(Intl.supportedValuesOf('timeZone'));
        } else {
          setTimezoneList([
            'UTC',
            'America/New_York',
            'America/Chicago',
            'America/Denver',
            'America/Los_Angeles',
            'Europe/London',
            'Europe/Paris',
            'Europe/Berlin',
            'Asia/Dhaka',
            'Asia/Dubai',
            'Asia/Kolkata',
            'Asia/Singapore',
            'Asia/Tokyo',
            'Australia/Sydney',
          ]);
        }
      }
      setIsLoadingTimezones(false);
    }

    fetchTimezones();

    return () => {
      isMounted = false;
    };
  }, []);

  function handlePersonalChange(e) {
    const { name, value } = e.target;
    setPersonalData((prev) => ({ ...prev, [name]: value }));
  }

  function handlePasswordChange(e) {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  }

  // Handle avatar upload with automatic compression for >2 MB images
  async function handleAvatarSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoMessage({ text: '', type: '' });
    setIsUploadingPhoto(true);

    try {
      let uploadFile = file;

      // If file exceeds 2 MB, compress automatically
      if (file.size > MAX_BYTES) {
        setPhotoMessage({
          text: `Photo is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Compressing under 2MB...`,
          type: 'info',
        });

        const compressed = await compressImageUnderLimit(file, MAX_BYTES);
        uploadFile = compressed.file;
      }

      const fileExt = uploadFile.name?.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Upload to Supabase Storage in 'avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, uploadFile, {
          upsert: true,
          contentType: uploadFile.type || 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const refreshedUrl = `${publicUrl}?t=${Date.now()}`;

      // Update profiles record
      const { data: updatedProfile, error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: refreshedUrl })
        .eq('user_id', userId)
        .select()
        .single();

      if (dbError) throw dbError;

      setAvatarUrl(refreshedUrl);
      if (onProfileUpdate) {
        onProfileUpdate(updatedProfile || { avatar_url: refreshedUrl });
      }

      setPhotoMessage({ text: 'Profile picture updated successfully!', type: 'success' });
    } catch (err) {
      console.error('Avatar upload error:', err);
      setPhotoMessage({
        text: err.message || 'Failed to upload photo. Please check storage bucket setup.',
        type: 'error',
      });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // Save personal information
  async function handleSavePersonal(e) {
    e.preventDefault();
    setPersonalMessage({ text: '', type: '' });
    setIsSavingPersonal(true);

    try {
      const cleanUsername = personalData.username.trim().toLowerCase();
      if (!cleanUsername) {
        throw new Error('Username is required.');
      }

      const updates = {
        username: cleanUsername,
        first_name: personalData.first_name.trim(),
        last_name: personalData.last_name.trim(),
      };

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) throw updateError;

      if (onProfileUpdate) onProfileUpdate(updatedProfile);
      setPersonalMessage({ text: 'Personal information saved successfully!', type: 'success' });
    } catch (err) {
      console.error('Update profile error:', err);
      setPersonalMessage({ text: err.message || 'Could not update profile.', type: 'error' });
    } finally {
      setIsSavingPersonal(false);
    }
  }

  // Change password
  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordMessage({ text: '', type: '' });

    if (!passwordData.currentPassword) {
      setPasswordMessage({ text: 'Please enter your current password.', type: 'error' });
      return;
    }

    if (!passwordData.password) {
      setPasswordMessage({ text: 'Please enter a new password.', type: 'error' });
      return;
    }

    if (passwordData.password.length < 6) {
      setPasswordMessage({ text: 'Password must be at least 6 characters long.', type: 'error' });
      return;
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      setPasswordMessage({ text: 'Passwords do not match.', type: 'error' });
      return;
    }

    setIsChangingPassword(true);

    try {
      // Re-authenticate user with current password to verify identity
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: passwordData.currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect.');
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordData.password,
      });

      if (error) throw error;

      setPasswordData({ currentPassword: '', password: '', confirmPassword: '' });
      setPasswordMessage({ text: 'Password updated successfully!', type: 'success' });
    } catch (err) {
      console.error('Password change error:', err);
      setPasswordMessage({ text: err.message || 'Failed to update password.', type: 'error' });
    } finally {
      setIsChangingPassword(false);
    }
  }

  // Save timezone
  async function handleSaveTimezone(e) {
    e.preventDefault();
    setTimezoneMessage({ text: '', type: '' });
    setIsSavingTimezone(true);

    try {
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ timezone: selectedTimezone })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) throw updateError;

      if (onProfileUpdate) onProfileUpdate(updatedProfile);
      setTimezoneMessage({ text: 'Timezone updated successfully!', type: 'success' });
    } catch (err) {
      console.error('Save timezone error:', err);
      setTimezoneMessage({ text: err.message || 'Failed to update timezone.', type: 'error' });
    } finally {
      setIsSavingTimezone(false);
    }
  }

  // Current time preview in chosen timezone
  let previewTime = '';
  try {
    previewTime = new Date().toLocaleTimeString(undefined, {
      timeZone: selectedTimezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    previewTime = '—';
  }

  return (
    <section className="section profile-view">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Profile Settings</h1>
        </div>
      </div>

      <div className="profile-layout">
        {/* Avatar Upload Card */}
        <div className="profile-card profile-avatar-card">
          <div className="profile-avatar-wrapper">
            {avatarUrl ? (
              <img src={avatarUrl} alt="User Avatar" className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-placeholder">
                <User size={48} />
              </div>
            )}

            <button
              type="button"
              className="avatar-upload-badge"
              title="Upload new photo"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
            >
              {isUploadingPhoto ? <Loader2 size={16} className="spin-icon" /> : <Camera size={16} />}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/png, image/jpeg, image/webp, image/gif"
              onChange={handleAvatarSelect}
            />
          </div>

          <div className="profile-avatar-info">
            <h3 className="profile-display-title">
              {profile?.first_name || profile?.username || 'LifeOS User'}
            </h3>
            <p className="profile-display-sub">{email}</p>
            <button
              type="button"
              className="secondary-button photo-action-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
            >
              {isUploadingPhoto ? 'Processing photo...' : 'Change Photo'}
            </button>
            
          </div>

          {photoMessage.text && (
            <div
              className={`status-message ${
                photoMessage.type === 'error'
                  ? 'error'
                  : photoMessage.type === 'success'
                  ? 'success'
                  : 'field-hint'
              }`}
            >
              {photoMessage.type === 'error' ? (
                <AlertCircle size={16} />
              ) : photoMessage.type === 'success' ? (
                <CheckCircle2 size={16} />
              ) : null}
              <span>{photoMessage.text}</span>
            </div>
          )}
        </div>

        {/* Tab Options Navigation */}
        <div className="profile-tabs">
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            <User size={16} /> Personal Information
          </button>
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <KeyRound size={16} /> Change Password
          </button>
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === 'timezone' ? 'active' : ''}`}
            onClick={() => setActiveTab('timezone')}
          >
            <Clock size={16} /> Timezone
          </button>
        </div>

        {/* Tab 1: Personal Information Card */}
        {activeTab === 'personal' && (
          <div className="profile-card">
            <div className="profile-card-header">
              <User size={18} />
              <h2>Personal Information</h2>
            </div>

            <form onSubmit={handleSavePersonal}>
              <div className="field-row">
                <label>
                  First name
                  <input
                    type="text"
                    name="first_name"
                    value={personalData.first_name}
                    onChange={handlePersonalChange}
                    placeholder="John"
                  />
                </label>

                <label>
                  Last name
                  <input
                    type="text"
                    name="last_name"
                    value={personalData.last_name}
                    onChange={handlePersonalChange}
                    placeholder="Doe"
                  />
                </label>
              </div>

              <label>
                Username
                <input
                  type="text"
                  name="username"
                  value={personalData.username}
                  onChange={handlePersonalChange}
                  placeholder="username"
                  required
                />
                <span className="field-hint">Lowercase, numbers, and underscores (3-30 chars)</span>
              </label>

              {personalMessage.text && (
                <div className={`status-message ${personalMessage.type}`}>
                  {personalMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                  <span>{personalMessage.text}</span>
                </div>
              )}

              <button type="submit" className="submit-button" disabled={isSavingPersonal}>
                {isSavingPersonal ? (
                  <>
                    <Loader2 size={16} className="spin-icon" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save Changes
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Change Password Card */}
        {activeTab === 'password' && (
          <div className="profile-card">
            <div className="profile-card-header">
              <KeyRound size={18} />
              <h2>Change Password</h2>
            </div>

            <form onSubmit={handleChangePassword}>
              <label>
                Current Password
                <div className="input-with-icon">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <label>
                New Password
                <div className="input-with-icon">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={passwordData.password}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <label>
                Confirm New Password
                <div className="input-with-icon">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              {passwordMessage.text && (
                <div className={`status-message ${passwordMessage.type}`}>
                  {passwordMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                  <span>{passwordMessage.text}</span>
                </div>
              )}

              <button type="submit" className="submit-button" disabled={isChangingPassword}>
                {isChangingPassword ? (
                  <>
                    <Loader2 size={16} className="spin-icon" /> Updating Password...
                  </>
                ) : (
                  <>
                    <KeyRound size={16} /> Update Password
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Timezone Card */}
        {activeTab === 'timezone' && (
          <div className="profile-card">
            <div className="profile-card-header">
              <Clock size={18} />
              <h2>Timezone Settings</h2>
            </div>

            <form onSubmit={handleSaveTimezone}>
              <label>
                Select Timezone
                <select
                  className="profile-select"
                  value={selectedTimezone}
                  onChange={(e) => setSelectedTimezone(e.target.value)}
                >
                  {isLoadingTimezones && <option value={selectedTimezone}>Loading timezones...</option>}
                  {!isLoadingTimezones && !timezoneList.includes(selectedTimezone) && (
                    <option value={selectedTimezone}>{selectedTimezone}</option>
                  )}
                  {timezoneList.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
            
              </label>

              {selectedTimezone && (
                <div className="timezone-preview">
                  <span>Current local time in {selectedTimezone}:</span>
                  <strong>{previewTime}</strong>
                </div>
              )}

              {timezoneMessage.text && (
                <div className={`status-message ${timezoneMessage.type}`}>
                  {timezoneMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                  <span>{timezoneMessage.text}</span>
                </div>
              )}

              <button type="submit" className="submit-button" disabled={isSavingTimezone}>
                {isSavingTimezone ? (
                  <>
                    <Loader2 size={16} className="spin-icon" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save Timezone
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

export default ProfileSection;


