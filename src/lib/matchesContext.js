import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { fetchMatches } from './matchService';
import { useUser } from './userContext';
import { supabase } from './supabase';

const MatchesContext = createContext();

export function useMatches() {
  const context = useContext(MatchesContext);
  if (!context) {
    throw new Error('useMatches must be used within MatchesProvider');
  }
  return context;
}

export function MatchesProvider({ children }) {
  const { user } = useUser();
  const [matches, setMatches] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const subscriptionRef = useRef(null);

  // Load matches when user is available
  useEffect(() => {
    if (user) {
      loadMatches();
      setupSubscription();
    } else {
      setMatches([]);
      setTotalUnread(0);
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [user]);

  // Calculate total unread count whenever matches change
  useEffect(() => {
    const total = matches.reduce((sum, match) => sum + (match.unreadCount || 0), 0);
    setTotalUnread(total);
  }, [matches]);

  const loadMatches = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await fetchMatches(user.id);
      setMatches(data);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSubscription = () => {
    if (!user) return;

    // Subscribe to match changes (new matches, updates, and deletes)
    subscriptionRef.current = supabase
      .channel('matches_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user1_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('Match INSERT (user1):', payload);
          await loadMatches();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user2_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('Match INSERT (user2):', payload);
          await loadMatches();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `user1_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('Match UPDATE (user1):', payload);
          await loadMatches();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `user2_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('Match UPDATE (user2):', payload);
          await loadMatches();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'matches',
        },
        async (payload) => {
          console.log('Match DELETE:', payload);
          // Check if this deleted match involves current user
          const deletedMatch = payload.old;
          if (deletedMatch.user1_id === user.id || deletedMatch.user2_id === user.id) {
            console.log('Match deleted for current user, reloading...');
            await loadMatches();
          }
        }
      )
      .subscribe();
  };

  return (
    <MatchesContext.Provider
      value={{
        matches,
        totalUnread,
        loading,
        loadMatches,
      }}
    >
      {children}
    </MatchesContext.Provider>
  );
}
