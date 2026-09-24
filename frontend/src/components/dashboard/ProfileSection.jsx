function ProfileSection({ profile, email }) {
  return (
    <section className="section">
      <h1>Profile</h1>
      <div className="profile-card">
        <div className="profile-row"><span className="record-sub">Username</span><span>{profile?.username || '—'}</span></div>
        <div className="profile-row"><span className="record-sub">First name</span><span>{profile?.first_name || '—'}</span></div>
        <div className="profile-row"><span className="record-sub">Last name</span><span>{profile?.last_name || '—'}</span></div>
        <div className="profile-row"><span className="record-sub">Email</span><span>{email}</span></div>
        <div className="profile-row"><span className="record-sub">Timezone</span><span>{profile?.timezone || 'UTC'}</span></div>
      </div>
    </section>
  );
}

export default ProfileSection;
