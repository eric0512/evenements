import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// Fonction d'authentification avec Google Drive API
function getDriveClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!clientEmail || !privateKey) {
    throw new Error('Variables d\'environnement Google Drive manquantes (GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY).');
  }

  // Correction des retours à la ligne dans la clé privée
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: formattedPrivateKey,
    scopes: ['https://www.googleapis.com/auth/drive']
  });

  return {
    drive: google.drive({ version: 'v3', auth }),
    folderId,
  };
}

// Nom du fichier de données stocké sur Drive
const DATA_FILE_NAME = 'evenements_data.json';

// Trouver ou créer le fichier data.json sur Google Drive
async function getOrCreateFile(drive: any, folderId?: string) {
  // Recherche du fichier dans le dossier parent s'il est défini
  let query = `name = '${DATA_FILE_NAME}' and trashed = false`;
  if (folderId) {
    query += ` and '${folderId}' in parents`;
  }

  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  const files = response.data.files;

  if (files && files.length > 0) {
    return files[0].id;
  }

  // Création du fichier si non existant
  const fileMetadata: any = {
    name: DATA_FILE_NAME,
    mimeType: 'application/json',
  };
  if (folderId) {
    fileMetadata.parents = [folderId];
  }

  const media = {
    mimeType: 'application/json',
    body: JSON.stringify({ evenements: [] }),
  };

  const file = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id',
  });

  return file.data.id;
}

export async function GET() {
  try {
    const { drive, folderId } = getDriveClient();
    const fileId = await getOrCreateFile(drive, folderId);

    // Téléchargement du contenu du fichier
    const fileResponse = await drive.files.get({
      fileId: fileId,
      alt: 'media',
    });

    return NextResponse.json(fileResponse.data);
  } catch (error: any) {
    console.error('Erreur de lecture Google Drive:', error);
    // Si l'intégration n'est pas encore configurée (environnement local), on renvoie un état simulé en local
    return NextResponse.json(
      { error: error.message, isDemo: true, evenements: [] },
      { status: 200 } // Statut 200 pour permettre une utilisation démo en local sans planter l'UI
    );
  }
}

export async function POST(request: Request) {
  try {
    const { drive, folderId } = getDriveClient();
    const fileId = await getOrCreateFile(drive, folderId);
    const body = await request.json();

    // Mise à jour du fichier sur Google Drive
    await drive.files.update({
      fileId: fileId,
      media: {
        mimeType: 'application/json',
        body: JSON.stringify(body, null, 2),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur d\'écriture Google Drive:', error);
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}
