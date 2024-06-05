import { useCallback, useState } from 'react';
import type {
  AccountNotifications,
  AuthState,
  GitifyError,
  SettingsState,
  Status,
} from '../types';
import type { Notification } from '../typesGitHub';
import {
  ignoreNotificationThreadSubscription,
  markNotificationThreadAsDone,
  markNotificationThreadAsRead,
  markRepositoryNotificationsAsRead,
} from '../utils/api/client';
import { determineFailureType } from '../utils/api/errors';
import {
  getAllNotifications,
  setTrayIconColor,
  triggerNativeNotifications,
} from '../utils/notifications';
import { removeNotification } from '../utils/remove-notification';
import { removeNotifications } from '../utils/remove-notifications';

interface NotificationsState {
  notifications: AccountNotifications[];
  removeNotificationFromState: (
    settings: SettingsState,
    id: string,
    hostname: string,
  ) => void;
  fetchNotifications: (
    auth: AuthState,
    settings: SettingsState,
  ) => Promise<void>;
  markNotificationRead: (
    auth: AuthState,
    settings: SettingsState,
    notification: Notification,
  ) => Promise<void>;
  markNotificationDone: (
    auth: AuthState,
    settings: SettingsState,
    notification: Notification,
  ) => Promise<void>;
  unsubscribeNotification: (
    auth: AuthState,
    settings: SettingsState,
    notification: Notification,
  ) => Promise<void>;
  markRepoNotifications: (
    auth: AuthState,
    settings: SettingsState,
    notification: Notification,
  ) => Promise<void>;
  markRepoNotificationsDone: (
    auth: AuthState,
    settings: SettingsState,
    repoSlug: string,
    hostname: string,
  ) => Promise<void>;
  status: Status;
  errorDetails: GitifyError;
}

export const useNotifications = (): NotificationsState => {
  const [status, setStatus] = useState<Status>('success');
  const [errorDetails, setErrorDetails] = useState<GitifyError>();

  const [notifications, setNotifications] = useState<AccountNotifications[]>(
    [],
  );

  const fetchNotifications = useCallback(
    async (auth: AuthState, settings: SettingsState) => {
      setStatus('loading');

      try {
        const fetchedNotifications = await getAllNotifications(auth, settings);

        setNotifications(fetchedNotifications);
        triggerNativeNotifications(
          notifications,
          fetchedNotifications,
          settings,
          auth,
        );
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setErrorDetails(determineFailureType(err));
      }
    },
    [notifications],
  );

  const markNotificationRead = useCallback(
    async (
      auth: AuthState,
      settings: SettingsState,
      notification: Notification,
    ) => {
      setStatus('loading');

      try {
        await markNotificationThreadAsRead(
          notification.id,
          notification.account.hostname,
          notification.account.token,
        );

        const updatedNotifications = removeNotification(
          settings,
          notification.id,
          notifications,
          notification.account.hostname,
        );

        setNotifications(updatedNotifications);
        setTrayIconColor(updatedNotifications);
        setStatus('success');
      } catch (err) {
        setStatus('success');
      }
    },
    [notifications],
  );

  const markNotificationDone = useCallback(
    async (
      auth: AuthState,
      settings: SettingsState,
      notification: Notification,
    ) => {
      setStatus('loading');

      try {
        await markNotificationThreadAsDone(
          notification.id,
          notification.account.hostname,
          notification.account.token,
        );

        const updatedNotifications = removeNotification(
          settings,
          notification.id,
          notifications,
          notification.account.hostname,
        );

        setNotifications(updatedNotifications);
        setTrayIconColor(updatedNotifications);
        setStatus('success');
      } catch (err) {
        setStatus('success');
      }
    },
    [notifications],
  );

  const unsubscribeNotification = useCallback(
    async (
      auth: AuthState,
      settings: SettingsState,
      notification: Notification,
    ) => {
      setStatus('loading');

      try {
        await ignoreNotificationThreadSubscription(
          notification.id,
          notification.account.hostname,
          notification.account.token,
        );
        await markNotificationRead(auth, settings, notification);
        setStatus('success');
      } catch (err) {
        setStatus('success');
      }
    },
    [notifications],
  );

  const markRepoNotifications = useCallback(
    async (
      auth: AuthState,
      settings: SettingsState,
      notification: Notification,
    ) => {
      setStatus('loading');

      try {
        await markRepositoryNotificationsAsRead(
          notification.repository.full_name,
          notification.account.hostname,
          notification.account.token,
        );
        const updatedNotifications = removeNotifications(
          notification.repository.full_name,
          notifications,
          notification.account.hostname,
        );

        setNotifications(updatedNotifications);
        setTrayIconColor(updatedNotifications);
        setStatus('success');
      } catch (err) {
        setStatus('success');
      }
    },
    [notifications],
  );

  const markRepoNotificationsDone = useCallback(
    async (
      auth: AuthState,
      settings: SettingsState,
      notification: Notification,
    ) => {
      setStatus('loading');

      try {
        // TODO : Adam fix this
        const accountIndex = notifications.findIndex(
          (accountNotifications) =>
            accountNotifications.account.hostname ===
            notification.account.hostname,
        );

        if (accountIndex !== -1) {
          const notificationsToRemove = notifications[
            accountIndex
          ].notifications.filter(
            (notif) =>
              notif.repository.full_name === notification.repository.full_name,
          );

          await Promise.all(
            notificationsToRemove.map((notification) =>
              markNotificationDone(auth, settings, notification),
            ),
          );
        }

        const updatedNotifications = removeNotifications(
          repoSlug,
          notifications,
          hostname,
        );

        setNotifications(updatedNotifications);
        setTrayIconColor(updatedNotifications);
        setStatus('success');
      } catch (err) {
        setStatus('success');
      }
    },
    [notifications],
  );

  const removeNotificationFromState = useCallback(
    (settings: SettingsState, id: string, hostname: string) => {
      const updatedNotifications = removeNotification(
        settings,
        id,
        notifications,
        hostname,
      );

      setNotifications(updatedNotifications);
      setTrayIconColor(updatedNotifications);
    },
    [notifications],
  );

  return {
    status,
    errorDetails,
    notifications,

    removeNotificationFromState,
    fetchNotifications,
    markNotificationRead,
    markNotificationDone,
    unsubscribeNotification,
    markRepoNotifications,
    markRepoNotificationsDone,
  };
};
