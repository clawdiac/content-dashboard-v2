import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Default watch directory
const WATCH_DIR = path.join(os.homedir(), '.openclaw', 'cache', 'comfyui-outputs');

// Image extensions to watch
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.avi', '.mov'];
const SUPPORTED_EXTENSIONS = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS];

// Metadata extraction function
async function extractMetadata(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const filename = path.basename(filePath);
    
    // Extract dimensions (simplified - for real EXIF we'd use sharp or exifparser)
    let width = 1024;
    let height = 1024;
    
    // Extract batch ID from filename
    const dateMatch = filename.match(/\d{4}-\d{2}-\d{2}/);
    const batchId = dateMatch ? dateMatch[0] : filename.substring(0, 8);

    return {
      filename,
      size: stats.size,
      width,
      height,
      created_at: stats.birthtime?.toISOString() || stats.mtime?.toISOString() || new Date().toISOString(),
      approval_status: null,
      batch_id: batchId,
    };
  } catch (err) {
    console.error(`Error extracting metadata for ${filePath}:`, err);
    return null;
  }
}

// File watcher initialization
export function initFileWatcher(io) {
  // Ensure watch directory exists
  if (!fs.existsSync(WATCH_DIR)) {
    console.log(`📂 Watch directory does not exist: ${WATCH_DIR}`);
    console.log(`   Creating: ${WATCH_DIR}`);
    fs.mkdirSync(WATCH_DIR, { recursive: true });
  }

  console.log(`👁️  File watcher initialized for: ${WATCH_DIR}`);

  // Initialize watcher with debouncing
  const watcher = chokidar.watch(WATCH_DIR, {
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100,
    },
    ignored: /(^|[\/\\])\.|node_modules/,
    depth: 2,
    usePolling: false,
  });

  // Debounce timer
  let debounceTimer = null;
  const debounceMs = 200;

  watcher
    .on('add', async (filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      
      // Filter by supported extensions
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        return;
      }

      // Debounce file events
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const metadata = await extractMetadata(filePath);
        if (metadata) {
          console.log(`✨ New image detected: ${metadata.filename}`);
          io.emit('image:new', metadata);
        }
      }, debounceMs);
    })
    .on('change', async (filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.includes(ext)) return;

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const metadata = await extractMetadata(filePath);
        if (metadata) {
          console.log(`🔄 Image updated: ${metadata.filename}`);
          io.emit('image:updated', metadata);
        }
      }, debounceMs);
    })
    .on('unlink', (filePath) => {
      const filename = path.basename(filePath);
      const ext = path.extname(filePath).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.includes(ext)) return;

      console.log(`🗑️  Image removed: ${filename}`);
      io.emit('image:removed', { filename });
    })
    .on('error', (error) => {
      console.error('Watcher error:', error);
    });

  return watcher;
}

// Function to get all existing images in watch directory
export async function getAllImages() {
  try {
    if (!fs.existsSync(WATCH_DIR)) {
      return [];
    }

    const files = fs.readdirSync(WATCH_DIR);
    const images = [];

    for (const file of files) {
      const filePath = path.join(WATCH_DIR, file);
      const ext = path.extname(file).toLowerCase();

      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        const metadata = await extractMetadata(filePath);
        if (metadata) {
          images.push(metadata);
        }
      }
    }

    return images.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
  } catch (err) {
    console.error('Error reading directory:', err);
    return [];
  }
}

export { WATCH_DIR, SUPPORTED_EXTENSIONS };
