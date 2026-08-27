// Extracts a Google Drive file id from a docs.google.com/drive.google.com
// link (e.g. .../document/d/FILE_ID/edit, .../file/d/FILE_ID/view). Returns
// null for published Google Forms links (.../forms/d/e/PUBLISHED_ID/viewform)
// since that id is not the form's real Drive file id and can't be used to
// copy the file — only the owner's .../forms/d/FILE_ID/edit link exposes
// that. Also null for anything not hosted on Drive at all (Wordwall,
// Wayground, Kahoot, etc).
export function extractDriveFileId(url: string): string | null {
  try {
    const u = new URL(url)
    if (!['docs.google.com', 'drive.google.com'].includes(u.hostname)) return null
    if (u.pathname.includes('/forms/d/e/')) return null
    const m = u.pathname.match(/\/d\/([a-zA-Z0-9_-]{15,})/)
    return m ? m[1] : null
  } catch {
    return null
  }
}
