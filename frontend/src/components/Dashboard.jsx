import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Sidebar from './Sidebar';
import OverviewSection from './dashboard/OverviewSection';
import TasksSection from './dashboard/TasksSection';
import GoalsSection from './dashboard/GoalsSection';
import NotesSection from './dashboard/NotesSection';
import FinanceSection from './dashboard/FinanceSection';
import EventsSection from './dashboard/EventsSection';
import ProfileSection from './dashboard/ProfileSection';

function Dashboard({ session }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    let mounted = true;
    const userId = session.user.id;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      const [profileRes, tasksRes, goalsRes, notesRes, financesRes, eventsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).single(),
        supabase.from('tasks').select('*').eq('user_id', userId).order('due_date', { ascending: true }),
        supabase.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('notes').select('*').eq('user_id', userId).order('updated_at', { ascending: false }),
        supabase.from('finances').select('*').eq('user_id', userId).order('transaction_date', { ascending: false }),
        supabase.from('events').select('*').eq('user_id', userId).order('start_at', { ascending: true }),
      ]);

      if (!mounted) return;

      // Profile lookups 404 (PGRST116) for brand-new accounts before the signup trigger settles, so ignore that case.
      const firstError = [profileRes, tasksRes, goalsRes, notesRes, financesRes, eventsRes]
        .find((result) => result.error && result.error.code !== 'PGRST116');

      if (firstError) {
        setError(firstError.error.message);
        setLoading(false);
        return;
      }

      setData({
        profile: profileRes.data,
        tasks: tasksRes.data || [],
        goals: goalsRes.data || [],
        notes: notesRes.data || [],
        finances: financesRes.data || [],
        events: eventsRes.data || [],
      });
      setLoading(false);
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [session.user.id]);

  async function signOut() {
    await supabase.auth.signOut();
  }

  const displayName = data?.profile?.first_name || session.user.user_metadata?.username || session.user.email;

  return (
    <main className="workspace">
      <header className="workspace-header">
        <div className="brand-mark"><Sparkles size={18} /> LifeOS</div>
        <button className="signout-button" onClick={signOut}>Sign out</button>
      </header>

      {loading && <section className="workspace-content"><p className="eyebrow">Loading your dashboard...</p></section>}

      {!loading && error && (
        <section className="workspace-content">
          <p className="eyebrow">Something went wrong</p>
          <h1>Couldn't load your data.</h1>
          <p>{error}</p>
        </section>
      )}

      {!loading && !error && data && (
        <div className="workspace-shell">
          <Sidebar activeSection={activeSection} onSelect={setActiveSection} />

          <div className="workspace-main">
            {activeSection === 'overview' && <OverviewSection data={data} displayName={displayName} />}
            {activeSection === 'tasks' && <TasksSection tasks={data.tasks} />}
            {activeSection === 'goals' && <GoalsSection goals={data.goals} />}
            {activeSection === 'notes' && <NotesSection notes={data.notes} />}
            {activeSection === 'finance' && <FinanceSection finances={data.finances} />}
            {activeSection === 'events' && <EventsSection events={data.events} />}
            {activeSection === 'profile' && <ProfileSection profile={data.profile} email={session.user.email} />}
          </div>
        </div>
      )}
    </main>
  );
}

export default Dashboard;
