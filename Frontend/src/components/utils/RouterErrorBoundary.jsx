import { useRouteError } from "react-router-dom";

export default function RouterErrorBoundary() {
  const err = useRouteError();

  if (err.status || err.statusText) {
    return (
      <div style={{ padding: 40 }}>
        <h1>{err.status}</h1>
        <p>{err.statusText}</p>
        <p>{err.data || "No additional message"}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, color: "red" }}>
      <h1>Unhandled Error</h1>
      <pre>{err.message || err}</pre>
    </div>
  );
}
