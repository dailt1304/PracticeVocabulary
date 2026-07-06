import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    const targetId = userId || user?.id;
    if (!targetId) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetId)
      .single();
    if (data) {
      setProfile(data);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setProfile(null);
    }
    return { error };
  };

  const updateSessionResults = async ({ xpGained, progressUpdates }) => {
    if (!user) return;

    try {
      // 1. Update Profile XP
      const newXP = (profile?.total_xp || 0) + xpGained;
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ total_xp: newXP })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Upsert Learning Progress
      if (progressUpdates && progressUpdates.length > 0) {
        const { error: progressError } = await supabase
          .from('learning_progress')
          .upsert(progressUpdates, { onConflict: 'user_id,vocabulary_id' });
        if (progressError) throw progressError;
      }

      // 3. Update User Streak
      const { data: streakData, error: streakFetchError } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!streakFetchError) {
        const todayStr = new Date().toLocaleDateString('sv'); // Format: YYYY-MM-DD
        let currentStreak = 1;
        let longestStreak = 1;

        if (streakData) {
          const lastActivity = streakData.last_activity_date;
          currentStreak = streakData.current_streak;
          longestStreak = streakData.longest_streak;

          if (!lastActivity) {
            currentStreak = 1;
            longestStreak = Math.max(longestStreak, 1);
          } else {
            const todayDate = new Date(todayStr);
            const lastDate = new Date(lastActivity);
            const diffTime = todayDate - lastDate;
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
              currentStreak += 1;
              longestStreak = Math.max(longestStreak, currentStreak);
            } else if (diffDays > 1) {
              currentStreak = 1;
            }
          }

          await supabase
            .from('user_streaks')
            .update({
              current_streak: currentStreak,
              longest_streak: longestStreak,
              last_activity_date: todayStr
            })
            .eq('user_id', user.id);
        } else {
          await supabase
            .from('user_streaks')
            .insert({
              user_id: user.id,
              current_streak: 1,
              longest_streak: 1,
              last_activity_date: todayStr
            });
        }
      }

      // 4. Refresh local profile state
      await fetchProfile(user.id);
    } catch (err) {
      console.error('Error updating session results:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        fetchProfile,
        updateSessionResults,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
