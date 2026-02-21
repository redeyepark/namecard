import { promises as fs } from 'fs';
import path from 'path';
import type { CardRequest, RequestSummary } from '@/types/request';

const DATA_DIR = path.join(process.cwd(), 'data', 'requests');

export async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function saveRequest(request: CardRequest): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, `${request.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(request, null, 2), 'utf-8');
}

export async function saveImageFile(
  id: string,
  suffix: string,
  base64Data: string
): Promise<string> {
  await ensureDataDir();
  // Remove data URL prefix (e.g., "data:image/png;base64,")
  const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Content, 'base64');
  const fileName = `${id}-${suffix}.png`;
  const filePath = path.join(DATA_DIR, fileName);
  await fs.writeFile(filePath, buffer);
  return fileName;
}

export async function getRequest(id: string): Promise<CardRequest | null> {
  try {
    const filePath = path.join(DATA_DIR, `${id}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as CardRequest;
  } catch {
    return null;
  }
}

export async function getAllRequests(): Promise<RequestSummary[]> {
  await ensureDataDir();
  try {
    const files = await fs.readdir(DATA_DIR);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    const summaries: RequestSummary[] = [];
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(DATA_DIR, file);
        const data = await fs.readFile(filePath, 'utf-8');
        const request = JSON.parse(data) as CardRequest;
        summaries.push({
          id: request.id,
          displayName: request.card.front.displayName,
          status: request.status,
          submittedAt: request.submittedAt,
          hasIllustration: request.illustrationPath !== null,
        });
      } catch {
        // Skip corrupted files
      }
    }

    // Sort by submittedAt descending (newest first)
    summaries.sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

    return summaries;
  } catch {
    return [];
  }
}

export async function updateRequest(
  id: string,
  updates: Partial<CardRequest>
): Promise<CardRequest | null> {
  const request = await getRequest(id);
  if (!request) return null;

  const updated: CardRequest = {
    ...request,
    ...updates,
    id: request.id, // Prevent ID override
    updatedAt: new Date().toISOString(),
  };

  await saveRequest(updated);
  return updated;
}

export async function getImageFile(
  id: string,
  suffix: string
): Promise<Buffer | null> {
  try {
    const filePath = path.join(DATA_DIR, `${id}-${suffix}.png`);
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}
