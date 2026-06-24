import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import { fetchSessionDetails } from "../services/api.js";

function SessionDetailsView() {
  const { sessionId } = useParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDetails() {
      try {
        setLoading(true);
        setError("");
        const data = await fetchSessionDetails(sessionId);
        if (active) {
          setEvents(data);
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.error || "Unable to load session details.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDetails();

    return () => {
      active = false;
    };
  }, [sessionId]);

  return (
    <section className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Journey</p>
          <h2>Session details</h2>
          <p className="muted break-word">{sessionId}</p>
        </div>
        <Link className="button-link" to="/">
          Back to sessions
        </Link>
      </div>

      {loading && <LoadingState message="Loading user journey..." />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && events.length === 0 && (
        <EmptyState title="No events" message="This session does not have any recorded events." />
      )}

      {!loading && !error && events.length > 0 && (
        <ol className="timeline">
          {events.map((event) => (
            <li key={event.id}>
              <div className="timeline-dot" aria-hidden="true" />
              <div className="timeline-content">
                <div className="timeline-heading">
                  <span className={`event-pill ${event.event_type}`}>{event.event_type}</span>
                  <time>{formatDate(event.timestamp)}</time>
                </div>
                <p className="break-word">{event.page_url}</p>
                {event.event_type === "click" && (
                  <p className="muted">
                    Coordinates: x {event.x}, y {event.y}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

export default SessionDetailsView;
