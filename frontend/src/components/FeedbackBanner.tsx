import { useAdmin } from "../admin-context";

export function FeedbackBanner() {
  const { error, notice, clearMessages } = useAdmin();
  if (!error && !notice) return null;
  return <div className={error ? "feedback-banner error" : "feedback-banner success"} role="status"><span>{error || notice}</span><button type="button" onClick={clearMessages}>Đóng</button></div>;
}
