type NotificationCountBadgeProps = {
  count: number;
  active?: boolean;
};

export function NotificationCountBadge({ count, active = false }: NotificationCountBadgeProps) {
  if (count <= 0) {
    return null;
  }

  const display = count > 99 ? "99+" : String(count);

  return (
    <span
      className={`aptus-notification-count-badge${active ? " is-active" : ""}`}
      aria-hidden="true"
    >
      {display}
    </span>
  );
}
