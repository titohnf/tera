import { google } from 'googleapis'

// Authenticates as a Google Cloud service account so the app itself (not an
// interactive session) can copy files into the shared "Materi dan Bank
// Soal" Drive folder. The service account must be shared as an Editor on
// that folder, and the source files must be shared broadly enough (e.g.
// "Anyone with the link can view") for the service account to read them.
export function getDriveClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!email || !key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY belum diatur')
  }
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
  return google.drive({ version: 'v3', auth })
}
