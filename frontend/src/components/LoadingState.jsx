function LoadingState({ message = "Loading data..." }) {
  return (
    <div className="state-box">
      <span className="loader" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

export default LoadingState;
