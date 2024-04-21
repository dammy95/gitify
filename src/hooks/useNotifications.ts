import axios, { type AxiosError, type AxiosPromise } from 'axios';
import { useCallback, useState } from 'react';

import { Notification } from '@electron/remote';
import type {
  Account,
  AccountNotifications,
  AuthState,
  GitifyError,
  SettingsState,
} from '../types';
import type { GithubRESTError, Notification } from '../typesGithub';
import { apiRequestAuth } from '../utils/api-requests';
import { determineFailureType } from '../utils/api/errors';
import { generateGitHubAPIUrl, getTokenForHost } from '../utils/helpers';
import {
  setTrayIconColor,
  triggerNativeNotifications,
} from '../utils/notifications';
import { removeNotification } from '../utils/remove-notification';
import { removeNotifications } from '../utils/remove-notifications';
import { getGitifySubjectDetails } from '../utils/subject';

interface NotificationsState {
  notifications: AccountNotifications[];
  removeNotificationFromState: (id: string, hostname: string) => void;
  fetchNotifications: (
    accounts: AuthState,
    settings: SettingsState,
  ) => Promise<void>;
  markNotificationRead: (
    accounts: AuthState,
    id: string,
    hostname: string,
  ) => Promise<void>;
  markNotificationDone: (
    accounts: AuthState,
    id: string,
    hostname: string,
  ) => Promise<void>;
  unsubscribeNotification: (
    accounts: AuthState,
    id: string,
    hostname: string,
  ) => Promise<void>;
  markRepoNotifications: (
    accounts: AuthState,
    repoSlug: string,
    hostname: string,
  ) => Promise<void>;
  markRepoNotificationsDone: (
    accounts: AuthState,
    repoSlug: string,
    hostname: string,
  ) => Promise<void>;
  isFetching: boolean;
  requestFailed: boolean;
  errorDetails: GitifyError;
}

export const useNotifications = (): NotificationsState => {
  const [isFetching, setIsFetching] = useState(false);
  const [requestFailed, setRequestFailed] = useState(false);
  const [errorDetails, setErrorDetails] = useState<GitifyError>();

  const [notifications, setNotifications] = useState<AccountNotifications[]>(
    [],
  );

  const fetchNotifications = useCallback(
    async (auth: AuthState, settings: SettingsState) => {
      async function getNotifications(account: Account) {
        const url = generateGitHubAPIUrl(account.hostname);
        url.pathname = '/notifications';
        url.searchParams.set('participating', String(settings.participating));

        return apiRequestAuth(url.href, 'GET', account.token);
      }

      // function getGitHubNotifications() {
      //   if (!isGitHubLoggedIn(accounts)) {
      //     return;
      //   }
      //   return getNotifications(
      //     Constants.DEFAULT_AUTH_OPTIONS.hostname,
      //     accounts.token,
      //   );
      // }

      // function getEnterpriseNotifications() {
      //   return accounts.enterpriseAccounts.map((account) => {
      //     return getNotifications(account.hostname, account.token);
      //   });
      // }

      function getAllNotifications() {
        return auth.accounts.map((account) => {
          return {
            account: account,
            notifications: getNotifications(account),
          };
        });
      }

      setIsFetching(true);

      try {
        const allNotifications: AccountNotifications[] = await Promise.all(
          getAllNotifications().map(async (notificationPromise) => {
            const { account, notifications } = await notificationPromise;
            return { account, notifications: (await notifications).data };
          }),
        );

        console.log('all notifications: ', JSON.stringify(allNotifications));

        setNotifications(allNotifications);
        triggerNativeNotifications(
          notifications,
          allNotifications,
          settings,
          auth,
        );
        setIsFetching(false);
      } catch (err) {
        const error = err as AxiosError<GithubRESTError>;

        setIsFetching(false);
        setRequestFailed(true);
        setErrorDetails(determineFailureType(error));
      }
    },
    [notifications],
  );

  const markNotificationRead = useCallback(
    async (accounts: AuthState, id: string, hostname: string) => {
      setIsFetching(true);

      // const isEnterprise = isEnterpriseHost(hostname);
      // const token = isEnterprise
      //   ? getEnterpriseAccountToken(hostname, accounts.enterpriseAccounts)
      //   : accounts.token;
      const token = getTokenForHost(hostname, accounts);

      try {
        await apiRequestAuth(
          `$generateGitHubAPIUrl(hostname)notifications/threads/$id`,
          'PATCH',
          token,
          {},
        );

        const updatedNotifications = removeNotification(
          id,
          notifications,
          hostname,
        );

        setNotifications(updatedNotifications);
        setTrayIconColor(updatedNotifications);
        setIsFetching(false);
      } catch (err) {
        setIsFetching(false);
      }
    },
    [notifications],
  );

  const markNotificationDone = useCallback(
    async (accounts: AuthState, id: string, hostname: string) => {
      setIsFetching(true);

      // const isEnterprise = isEnterpriseHost(hostname);
      // const token = isEnterprise
      //   ? getEnterpriseAccountToken(hostname, accounts.enterpriseAccounts)
      //   : accounts.token;

      const token = getTokenForHost(hostname, accounts);

      try {
        await apiRequestAuth(
          `$generateGitHubAPIUrl(hostname)notifications/threads/$id`,
          'DELETE',
          token,
          {},
        );

        const updatedNotifications = removeNotification(
          id,
          notifications,
          hostname,
        );

        setNotifications(updatedNotifications);
        setTrayIconColor(updatedNotifications);
        setIsFetching(false);
      } catch (err) {
        setIsFetching(false);
      }
    },
    [notifications],
  );

  const unsubscribeNotification = useCallback(
    async (accounts: AuthState, id: string, hostname: string) => {
      setIsFetching(true);

      // const isEnterprise = isEnterpriseHost(hostname);
      // const token = isEnterprise
      //   ? getEnterpriseAccountToken(hostname, accounts.enterpriseAccounts)
      //   : accounts.token;

      const token = getTokenForHost(hostname, accounts);

      try {
        await apiRequestAuth(
          `$generateGitHubAPIUrl(
            hostname,
          )notifications/threads/$id/subscription`,
          'PUT',
          token,
          { ignored: true },
        );
        await markNotificationRead(accounts, id, hostname);
      } catch (err) {
        setIsFetching(false);
      }
    },
    [notifications],
  );

  const markRepoNotifications = useCallback(
    async (accounts: AuthState, repoSlug: string, hostname: string) => {
      setIsFetching(true);

      // const isEnterprise = isEnterpriseHost(hostname);
      // const token = isEnterprise
      //   ? getEnterpriseAccountToken(hostname, accounts.enterpriseAccounts)
      //   : accounts.token;

      const token = getTokenForHost(hostname, accounts);

      try {
        await apiRequestAuth(
          `${generateGitHubAPIUrl(hostname)}repos/${repoSlug}/notifications`,
          'PUT',
          token,
          {},
        );

        const updatedNotifications = removeNotifications(
          repoSlug,
          notifications,
          hostname,
        );

        setNotifications(updatedNotifications);
        setTrayIconColor(updatedNotifications);
        setIsFetching(false);
      } catch (err) {
        setIsFetching(false);
      }
    },
    [notifications],
  );

  const markRepoNotificationsDone = useCallback(
    async (accounts: AuthState, repoSlug: string, hostname: string) => {
      setIsFetching(true);

      try {
        const accountIndex = notifications.findIndex(
          (accountNotifications) => accountNotifications.hostname === hostname,
        );

        if (accountIndex !== -1) {
          const notificationsToRemove = notifications[
            accountIndex
          ].notifications.filter(
            (notification) => notification.repository.full_name === repoSlug,
          );

          await Promise.all(
            notificationsToRemove.map((notification) =>
              markNotificationDone(
                accounts,
                notification.id,
                notifications[accountIndex].hostname,
              ),
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
        setIsFetching(false);
      } catch (err) {
        setIsFetching(false);
      }
    },
    [notifications],
  );

  const removeNotificationFromState = useCallback(
    (id: string, hostname: string) => {
      const updatedNotifications = removeNotification(
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
    isFetching,
    requestFailed,
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
