import { useState } from "react";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import { fetchHeatmap } from "../services/api.js";

function HeatmapView() {
  const [pageUrl, setPageUrl] = useState("/");
  const [clicks, setClicks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!pageUrl.trim()) {
      setError("Enter a page URL.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setHasSearched(true);
      const data = await fetchHeatmap(pageUrl.trim());
      setClicks(data);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load heatmap data.");
      setClicks([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Heatmap</p>
          <h2>Click positions by page</h2>
        </div>
      </div>

      <form className="filter-bar" onSubmit={handleSubmit}>
        <label htmlFor="page-url">Page URL</label>
        <input
          id="page-url"
          type="text"
          value={pageUrl}
          onChange={(event) => setPageUrl(event.target.value)}
          placeholder="/ or /pricing"
        />
        <button type="submit">Load heatmap</button>
      </form>

      {loading && <LoadingState message="Loading click data..." />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && !hasSearched && (
        <EmptyState title="Choose a page" message="Enter a tracked page URL to render click positions." />
      )}
      {!loading && !error && hasSearched && clicks.length === 0 && (
        <EmptyState title="No clicks found" message="Try the demo page, then come back and reload this heatmap." />
      )}

      {!loading && !error && clicks.length > 0 && (
        <div className="heatmap-panel">
          <div className="heatmap-stage" aria-label={`Heatmap for ${pageUrl}`}>
            {clicks.map((click, index) => (
              <span
                className="heatmap-dot"
                key={`${click.session_id}-${click.timestamp}-${index}`}
                title={`x ${click.x}, y ${click.y}`}
                style={{
                  left: `${normalize(click.x, window.innerWidth)}%`,
                  top: `${normalize(click.y, window.innerHeight)}%`,
                }}
              />
            ))}
          </div>
          <p className="muted">
            {clicks.length} click{clicks.length === 1 ? "" : "s"} rendered for {pageUrl}
          </p>
        </div>
      )}
    </section>
  );
}

function normalize(value, viewportSize) {
  const percent = (Number(value) / Math.max(viewportSize, 1)) * 100;
  return Math.min(Math.max(percent, 0), 100);
}

export default HeatmapView;
