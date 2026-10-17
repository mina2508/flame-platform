import { useEffect, useState, useRef } from 'react';
import { onLoadingChange } from '../api/client.js';

// App-wide loading indicator driven by axios interceptors.
// Shows a slim animated progress bar at the very top of the page
// whenever one or more API requests are in flight — covers every
// page and admin panel automatically.
export default function GlobalLoader() {
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef(null);

  useEffect(() => {
    const off = onLoadingChange((isActive) => {
      setActive(isActive);
      if (isActive) {
        clearTimeout(hideTimer.current);
        setVisible(true);
      } else {
        // keep the bar briefly so the finish animation reads as complete
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setVisible(false), 350);
      }
    });
    return () => { off(); clearTimeout(hideTimer.current); };
  }, []);

  if (!visible) return null;

  return (
    <div className="global-loader" role="status" aria-live="polite" aria-label="Loading">
      <div className={`global-loader-bar ${active ? 'is-active' : 'is-done'}`} />
    </div>
  );
}
