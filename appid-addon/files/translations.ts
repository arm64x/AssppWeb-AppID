import i18n from '../../i18n';

// Translations for the App ID add-on. Merged into the app's i18n bundles at
// import time without overwriting any key the upstream project defines.
const appIdStrings: Record<string, Record<string, string>> = {
  'en-US': {
    appId: 'App ID (Adam ID)',
    appIdPlaceholder: '479516143',
    appIdHint:
      "Use this for apps you've previously downloaded but that have since been removed from the App Store. No lookup is performed — select the region and account that previously purchased it.",
    invalidAppId: 'App ID must be numeric',
    title: 'Download by App ID',
  },
  ja: {
    appId: 'App ID（Adam ID）',
    appIdPlaceholder: '479516143',
    appIdHint:
      '以前ダウンロードしたが、App Store から削除されたアプリに使用します。検索は行われません — 購入済みの地域とアカウントを選択してください。',
    invalidAppId: 'App ID は数字で入力してください',
    title: 'App ID でダウンロード',
  },
  ko: {
    appId: 'App ID (Adam ID)',
    appIdPlaceholder: '479516143',
    appIdHint:
      '이전에 다운로드했지만 App Store에서 삭제된 앱에 사용합니다. 조회는 수행되지 않습니다 — 구매했던 지역과 계정을 선택하세요.',
    invalidAppId: 'App ID는 숫자여야 합니다',
    title: 'App ID로 다운로드',
  },
  ru: {
    appId: 'App ID (Adam ID)',
    appIdPlaceholder: '479516143',
    appIdHint:
      'Используйте для приложений, которые вы ранее скачивали, но которые были удалены из App Store. Поиск не выполняется — выберите регион и аккаунт, которые ранее приобрели его.',
    invalidAppId: 'App ID должен быть числом',
    title: 'Загрузка по App ID',
  },
  'zh-CN': {
    appId: 'App ID（Adam ID）',
    appIdPlaceholder: '479516143',
    appIdHint: '适用于您曾经下载过但已从 App Store 下架的应用。此模式不会执行查找——请选择曾购买该应用的地区与账号。',
    invalidAppId: 'App ID 必须为数字',
    title: '通过 App ID 下载',
  },
  'zh-TW': {
    appId: 'App ID（Adam ID）',
    appIdPlaceholder: '479516143',
    appIdHint:
      '適用於您曾下載過、但已從 App Store 下架的應用程式。此模式不會執行尋找——請選擇曾購買該應用程式的地區與帳號。',
    invalidAppId: 'App ID 必須為數字',
    title: '透過 App ID 下載',
  },
};

for (const [lng, add] of Object.entries(appIdStrings)) {
  i18n.addResourceBundle(lng, 'translation', { downloads: { appIdAddon: add } }, true, false);
}
