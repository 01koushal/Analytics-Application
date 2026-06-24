(function () {
  const DEFAULT_API_URL = "http://localhost:5000/api/events";
  const SESSION_KEY = "analytics_session_id";

  function createSessionId() {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }

    return "session_" + Date.now() + "_" + Math.random().toString(16).slice(2);
  }

  function getSessionId() {
    let sessionId = localStorage.getItem(SESSION_KEY);

    if (!sessionId) {
      sessionId = createSessionId();
      localStorage.setItem(SESSION_KEY, sessionId);
    }

    return sessionId;
  }

  function getPageUrl() {
    return window.location.pathname + window.location.search;
  }

  function sendEvent(eventData) {
    const endpoint = window.ANALYTICS_API_URL || DEFAULT_API_URL;

    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
      keepalive: true,
    }).catch(function (error) {
      console.warn("Analytics event failed", error);
    });
  }

  function track(eventType, extraData) {
    sendEvent({
      session_id: getSessionId(),
      event_type: eventType,
      page_url: getPageUrl(),
      timestamp: new Date().toISOString(),
      ...(extraData || {}),
    });
  }

  function trackPageView() {
    track("page_view");
  }

  function trackClick(event) {
    track("click", {
      x: event.clientX,
      y: event.clientY,
    });
  }

  window.AnalyticsTracker = {
    getSessionId,
    track,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", trackPageView);
  } else {
    trackPageView();
  }

  document.addEventListener("click", trackClick);
})();
