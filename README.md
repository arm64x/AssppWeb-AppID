# App ID download add-on

Add a "Download by App ID" card to the New Download page. Works for apps that
were removed from the App Store (no iTunes lookup).

## Use (also after every upstream update)

1. Update the project to the new AssppWeb version.
2. Copy this `appid-addon/` folder into the project root.
3. Run from the project root: `node appid-addon/apply.mjs`
4. Build as usual `docker compose up -d --build`.

Other commands: `--check` (is it applied?), `--remove` (undo).

## What it touches

- New files only in `frontend/src/addons/appid/` (component + translations).
- ONE edit to `frontend/src/components/Download/AddDownload.tsx`
  (an import + `<AppIdDownload />`).
- Does not edit locale files, hooks, apple/\*, types or the backend.

## If a future upstream version breaks it

The add-on imports these upstream modules: `apple/download` (getDownloadInfo),
`apple/plist` (parsePlist), `apple/config`, `api/client`, `utils/account`,
`utils/error`, `utils/toast`, `store/*`, `hooks/useAccounts`,
`components/common/CountrySelect`, `i18n`. If one is renamed, `tsc`/build will
point at the exact line in `files/AppIdDownload.tsx`.

## Screenshot

![App ID Download Add-on](https://github.com/arm64x/AssppWeb-AppID/blob/main/screenshot.png)
