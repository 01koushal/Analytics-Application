import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import { fetchSessions } from "../services/api.js";

function SessionsView() {
  const [sessions, setSessions] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSessions() {
      try {
        setLoading(true);
        setError("");
        const data = await fetchSessions();
        if (active) {
          setSessions(data);
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.error || "Unable to load sessions.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSessions();

    return () => {
      active = false;
    };
  }, []);

  const filteredSessions = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) {
      return sessions;
    }

    return sessions.filter((session) => session.session_id.toLowerCase().includes(value));
  }, [query, sessions]);

  return (
    <section className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Sessions</p>
          <h2>Tracked user sessions</h2>
        </div>
        <input
          className="search-input"
          type="search"
          placeholder="Search session id"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {loading && <LoadingState message="Loading sessions..." />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && sessions.length === 0 && (
        <EmptyState title="No sessions yet" message="Open the tracker demo and interact with the page to create data." />
      )}
      {!loading && !error && sessions.length > 0 && filteredSessions.length === 0 && (
        <EmptyState title="No matching sessions" message="Try a different session id." />
      )}

      {!loading && !error && filteredSessions.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Events</th>
                <th>First Seen</th>
                <th>Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => (
                <tr key={session.session_id}>
                  <td>
                    <Link className="session-link" to={`/sessions/${encodeURIComponent(session.session_id)}`}>
                      {session.session_id}
                    </Link>
                  </td>
                  <td>{session.event_count}</td>
                  <td>{formatDate(session.first_seen)}</td>
                  <td>{formatDate(session.last_seen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function formatDate(value) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default SessionsView;
