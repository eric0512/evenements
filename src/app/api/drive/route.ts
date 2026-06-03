import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// Chemin d'accès local Google Drive (via l'application Google Drive pour PC)
const LOCAL_DRIVE_PATH = 'G:\\Mon Drive\\Appli evenements\\sauvegarde-cousinade-100pourcent.json';

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
const DATA_FILE_NAME = 'sauvegarde-cousinade-100pourcent.json';

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
    // 1. Tenter de lire directement depuis le dossier Google Drive local (G:\) si disponible
    if (fs.existsSync(LOCAL_DRIVE_PATH)) {
      try {
        const fileContent = fs.readFileSync(LOCAL_DRIVE_PATH, 'utf-8');
        const parsed = JSON.parse(fileContent);
        return NextResponse.json({ evenements: parsed.evenements || parsed, isDemo: false });
      } catch (localError) {
        console.error('Erreur lors de la lecture du fichier local G:\\', localError);
      }
    }

    // 2. Fallback sur l'API Google Drive Cloud
    const { drive, folderId } = getDriveClient();
    const fileId = await getOrCreateFile(drive, folderId);

    // Téléchargement du contenu du fichier
    const fileResponse = await drive.files.get({
      fileId: fileId,
      alt: 'media',
    });

    return NextResponse.json(fileResponse.data);
  } catch (error: any) {
    console.warn('Google Drive Cloud non configuré ou inaccessible, utilisation du localStorage local (Mode Démo) :', error.message);
    
    // Si le dossier G:\ existe mais que le fichier n'a pas encore été créé
    const parentDir = path.dirname(LOCAL_DRIVE_PATH);
    if (fs.existsSync(parentDir)) {
      return NextResponse.json(
        { isDemo: false, evenements: [] },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: error.message, isDemo: true, evenements: [] },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let localSaved = false;

    // 1. Tenter d'écrire directement dans le dossier Google Drive local (G:\) si disponible
    const parentDir = path.dirname(LOCAL_DRIVE_PATH);
    if (fs.existsSync(parentDir)) {
      try {
        fs.writeFileSync(LOCAL_DRIVE_PATH, JSON.stringify(body, null, 2), 'utf-8');
        localSaved = true;
      } catch (localError) {
        console.error('Erreur lors de l\'écriture du fichier local G:\\', localError);
      }
    }

    // 2. Tenter d'écrire aussi sur le Cloud si configuré
    try {
      const { drive, folderId } = getDriveClient();
      const fileId = await getOrCreateFile(drive, folderId);

      await drive.files.update({
        fileId: fileId,
        media: {
          mimeType: 'application/json',
          body: JSON.stringify(body, null, 2),
        },
      });
      return NextResponse.json({ success: true });
    } catch (cloudError) {
      if (localSaved) {
        // Si sauvé en local mais cloud non configuré, c'est un succès local
        return NextResponse.json({ success: true, localOnly: true });
      }
      throw cloudError;
    }
  } catch (error: any) {
    console.error('Erreur d\'écriture Google Drive:', error);
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}
