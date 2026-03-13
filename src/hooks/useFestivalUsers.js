import { useState, useEffect, useRef } from 'react';
import { subscribeToNearbyUsers, findUsersInFestival } from '../lib/database';

export function useFestivalUsers(user) {
  const [users, setUsers] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const subscriptionRef = useRef(null);

  // Setup real-time subscription for user list changes
  useEffect(() => {
    if (!user?.id) return;

    subscriptionRef.current = subscribeToNearbyUsers(user.id, () => {
      if (user.status) {
        loadUsers();
      }
    });

    return () => subscriptionRef.current?.unsubscribe();
  }, [user?.id]);

  // Reload when user's active status or festival changes
  useEffect(() => {
    if (user?.status && user?.festival_id) {
      loadUsers();
    } else {
      setUsers([]);
    }
  }, [user?.status, user?.festival_id]);

  const loadUsers = async () => {
    if (!user?.festival_id) {
      setUsers([]);
      return;
    }

    try {
      const fetched = await findUsersInFestival(
        user.festival_id,
        user.id,
        user.gender,
        user.lookingFor
      );
      setUsers(fetched.filter((u) => u.id !== user.id));
    } catch (error) {
      console.error('Error loading festival users:', error);
    }
  };

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      await loadUsers();
    } catch (error) {
      console.error('Error refreshing users:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return { users, isRefreshing, refresh, reload: loadUsers };
}
