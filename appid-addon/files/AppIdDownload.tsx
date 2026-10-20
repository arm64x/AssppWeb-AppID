import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import './translations';
import CountrySelect from '../../components/common/CountrySelect';
import { useAccounts } from '../../hooks/useAccounts';
import { useSettingsStore } from '../../store/settings';
import { useToastStore } from '../../store/toast';
import { useDownloadsStore } from '../../store/downloads';
import { getDownloadInfo } from '../../apple/download';
import { parsePlist } from '../../apple/plist';
import { countryCodeMap, storeIdToCountry } from '../../apple/config';
import { apiPost } from '../../api/client';
import { accountHash, firstAccountCountry } from '../../utils/account';
import { getErrorMessage } from '../../utils/error';
import { getAccountContext } from '../../utils/toast';
import type { Software } from '../../types';

/**
 * Self-contained "download by App ID (Adam ID)" add-on.
 *
 * No iTunes lookup is performed, so apps that were removed from the App Store
 * can still be downloaded by an account that previously purchased them.
 * The real name / bundle ID / icon / artist are recovered from the
 * iTunesMetadata Apple returns with the download itself.
 */

function stubSoftware(adamId: string): Software {
  return {
    id: Number(adamId),
    bundleID: '',
    name: '',
    version: '',
    artistName: '',
    sellerName: '',
    description: '',
    averageUserRating: 0,
    userRatingCount: 0,
    artworkUrl: '',
    screenshotUrls: [],
    minimumOsVersion: '',
    releaseDate: '',
    primaryGenreName: '',
  };
}

function metadataFromITunes(iTunesMetadata?: string): Record<string, any> {
  if (!iTunesMetadata) return {};
  try {
    const bytes = Uint8Array.from(atob(iTunesMetadata), (c) => c.charCodeAt(0));
    const parsed = parsePlist(new TextDecoder().decode(bytes));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export default function AppIdDownload() {
  const { accounts, updateAccount } = useAccounts();
  const { defaultCountry } = useSettingsStore();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  const fetchTasks = useDownloadsStore((s) => s.fetchTasks);

  const [appId, setAppId] = useState('');
  const [country, setCountry] = useState(defaultCountry);
  const [countryTouched, setCountryTouched] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = /^\d+$/.test(appId.trim());

  const availableCountryCodes = Array.from(
    new Set(accounts.map((a) => storeIdToCountry(a.store)).filter(Boolean) as string[]),
  ).sort((a, b) => t(`countries.${a}`, a).localeCompare(t(`countries.${b}`, b)));
  const allCountryCodes = Object.keys(countryCodeMap).sort((a, b) =>
    t(`countries.${a}`, a).localeCompare(t(`countries.${b}`, b)),
  );

  const filteredAccounts = useMemo(
    () => accounts.filter((a) => storeIdToCountry(a.store) === country),
    [accounts, country],
  );

  useEffect(() => {
    if (filteredAccounts.length > 0) {
      if (!selectedAccount || !filteredAccounts.find((a) => a.email === selectedAccount)) {
        setSelectedAccount(filteredAccounts[0].email);
      }
    } else if (selectedAccount !== '') {
      setSelectedAccount('');
    }
  }, [filteredAccounts, selectedAccount]);

  const autoCountry = firstAccountCountry(accounts);
  useEffect(() => {
    if (countryTouched) return;
    const next = autoCountry ?? defaultCountry;
    if (next && next !== country) setCountry(next);
  }, [autoCountry, country, countryTouched, defaultCountry]);

  const account = accounts.find((a) => a.email === selectedAccount);

  async function handleDownload(e: React.FormEvent) {
    e.preventDefault();
    if (!account || !isValid) return;
    const adamId = appId.trim();
    const stub = stubSoftware(adamId);
    const ctx = getAccountContext(account, t);
    setLoading(true);
    try {
      const { output, updatedCookies } = await getDownloadInfo(account, stub);
      await updateAccount({ ...account, cookies: updatedCookies });

      const meta = metadataFromITunes(output.iTunesMetadata);
      const software: Software = {
        ...stub,
        version: output.bundleShortVersionString,
        name: meta.itemName || adamId,
        bundleID: meta.softwareVersionBundleId || adamId,
        artistName: meta.playlistArtistName || meta.artistName || '',
        artworkUrl: meta.softwareIcon512x512URL || meta.softwareIcon57x57URL || '',
        primaryGenreName: meta.genre || '',
      };

      await apiPost('/api/downloads', {
        software,
        accountHash: await accountHash(account),
        downloadURL: output.downloadURL,
        sinfs: output.sinfs,
        iTunesMetadata: output.iTunesMetadata,
      });
      fetchTasks();
      addToast(t('toast.msg', { appName: software.name, ...ctx }), 'info', t('toast.title.downloadStarted'));
    } catch (err) {
      addToast(
        t('toast.msgFailed', {
          appName: adamId,
          ...ctx,
          error: getErrorMessage(err, t('toast.title.downloadFailed')),
        }),
        'error',
        t('toast.title.downloadFailed'),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleDownload}
      className="min-w-0 space-y-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5 dark:bg-gray-900 dark:ring-white/10 sm:p-5"
    >
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('downloads.appIdAddon.title')}</h3>
      <div className="min-w-0">
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('downloads.appIdAddon.appId')}
        </label>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
          <input
            type="text"
            inputMode="numeric"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            placeholder={t('downloads.appIdAddon.appIdPlaceholder')}
            disabled={loading}
            className="min-h-11 w-full min-w-0 flex-1 rounded-xl border-0 bg-gray-100 px-4 py-2 text-base text-gray-900 focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-800 dark:text-white"
          />
          <button
            type="submit"
            disabled={loading || !account || !isValid}
            className="min-h-11 min-w-0 whitespace-normal break-words rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
          >
            {loading ? t('downloads.add.processing') : t('downloads.add.download')}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('downloads.appIdAddon.appIdHint')}</p>
        {appId.trim() !== '' && !isValid && (
          <p className="mt-1 text-xs text-red-500">{t('downloads.appIdAddon.invalidAppId')}</p>
        )}
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <CountrySelect
          value={country}
          onChange={(v) => {
            setCountry(v);
            setCountryTouched(true);
          }}
          availableCountryCodes={availableCountryCodes}
          allCountryCodes={allCountryCodes}
          disabled={loading}
          className="min-h-11 w-full min-w-0 max-w-full truncate disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 dark:disabled:bg-gray-800/50 dark:disabled:text-gray-400"
        />
        <select
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          disabled={loading || filteredAccounts.length === 0}
          className="min-h-11 w-full min-w-0 max-w-full truncate rounded-xl border-0 bg-gray-100 px-3 py-2 text-base text-gray-900 focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-800 dark:text-white"
        >
          {filteredAccounts.length > 0 ? (
            filteredAccounts.map((a) => (
              <option key={a.email} value={a.email}>
                {a.firstName} {a.lastName} ({a.email})
              </option>
            ))
          ) : (
            <option value="">{t('downloads.add.noAccountsForRegion')}</option>
          )}
        </select>
      </div>
    </form>
  );
}
