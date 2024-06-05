import type { AccountNotifications } from '../types';

export const removeNotifications = (
  repoSlug: string,
  notifications: AccountNotifications[],
  hostname: string,
): AccountNotifications[] => {
  // TODO - Adam Fix this
  const accountIndex = notifications.findIndex(
    (accountNotifications) =>
      accountNotifications.account.hostname === hostname,
  );

  if (accountIndex !== -1) {
    const updatedNotifications = [...notifications];
    updatedNotifications[accountIndex] = {
      ...updatedNotifications[accountIndex],
      notifications: updatedNotifications[accountIndex].notifications.filter(
        (notification) => notification.repository.full_name !== repoSlug,
      ),
    };
    return updatedNotifications;
  }

  return notifications;
};
