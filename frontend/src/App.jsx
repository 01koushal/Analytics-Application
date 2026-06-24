import { NavLink, Route, Routes } from "react-router-dom";
import HeatmapView from "./pages/HeatmapView.jsx";
import SessionDetailsView from "./pages/SessionDetailsView.jsx";
import SessionsView from "./pages/SessionsView.jsx";

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1>User Journey Dashboard</h1>
        </div>
        <nav className="nav-list" aria-label="Dashboard navigation">
          <NavLink to="/" end>
            Sessions
          </NavLink>
          <NavLink to="/heatmap">Heatmap</NavLink>
        </nav>
      </aside>

      <main className="content">
        <Routes>
          <Route path="/" element={<SessionsView />} />
          <Route path="/sessions/:sessionId" element={<SessionDetailsView />} />
          <Route path="/heatmap" element={<HeatmapView />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
