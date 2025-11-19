export const getDisplayName = (user) => {
  if (!user) return 'Unknown User';
  return (
    user.name || user.displayName || user.otherUserName || user.withUserName || user.borrowerName || user.itemOwnerName || user.receiverName || user.senderName || user.email || user.otherUserEmail || 'Unknown User'
  );
};

export const getSnippet = (text, max = 50) => {
  if (!text) return '';
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
};

export const formatRelativeTime = (ts) => {
  if (!ts) return '';
  const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
};
