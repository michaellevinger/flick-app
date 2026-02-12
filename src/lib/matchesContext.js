import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { fetchMatches, subscribeToMatches } from './messages';
import { useUser } from './userContext';

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

    subscriptionRef.current = subscribeToMatches(user.id, async (newMatch) => {
      // Reload matches when a new match is created
      await loadMatches();
    });
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
