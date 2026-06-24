function ErrorState({ message }) {
  return (
    <div className="state-box error-box">
      <strong>Something went wrong</strong>
      <p>{message}</p>
    </div>
  );
}

export default ErrorState;
