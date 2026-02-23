import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const AutoLogout = ({ children }) => {
  const { logout } = useAuth();
  const timerRef = useRef(null);

  // 30 minutes in milliseconds
  const TIMEOUT_DURATION = 3 * 60 * 1000;

  const handleLogout = useCallback(() => {
    console.log("User inactive for 30 minutes. Logging out...");
    logout();
  }, [logout]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(handleLogout, TIMEOUT_DURATION);
  }, [handleLogout, TIMEOUT_DURATION]);

  useEffect(() => {
    // Events that indicate the user is active
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    // Add listeners to the window
    events.forEach(event => window.addEventListener(event, resetTimer));

    // Start the timer when the component mounts
    resetTimer();

    return () => {
      // Clean up listeners and timer on unmount
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [resetTimer]);

  return children;
};

export default AutoLogout;