// A disk-backed File can become unreadable when an active session appends to it.
// Capture direct picks before awaiting network setup; retain directory handles so
// the worker can acquire fresh File objects and freeze the chosen family.
const message = name => `${name || 'The session file'} could not be read. It changed or is unavailable; select it again.`;

export async function capturePickedFiles(files, root) {
  return Promise.all(files.map(async entry => {
    if (entry.handle || entry.frozen || !entry.file) return entry;
    const direct = !entry.path.includes('/');
    const primary = root && entry.path.toLowerCase().includes(root.toLowerCase());
    if (!direct && !primary) return entry;
    try {
      const file = new Blob([await entry.file.arrayBuffer()]);
      return {...entry, file, frozen: true};
    } catch (cause) { throw new Error(message(entry.path), {cause}); }
  }));
}

export function fileSource(file, handle = null, frozen = false) {
  let stable = frozen ? file : null;
  let snapshotPromise = null;
  const source = {
    name: file.name,
    size: file.size,
    async slice(a, b) {
      if (stable) return new Uint8Array(await stable.slice(a, b).arrayBuffer());
      for (let attempt = 0; ; attempt++) {
        try {
          const current = handle ? await handle.getFile() : file;
          const bytes = new Uint8Array(await current.slice(a, b).arrayBuffer());
          if (bytes.length !== b - a) throw new DOMException('File size changed', 'NotReadableError');
          return bytes;
        } catch (cause) {
          if (handle && cause.name === 'NotReadableError' && attempt < 2) continue;
          throw new Error(message(file.name), {cause});
        }
      }
    },
    async snapshot() {
      if (stable) return;
      snapshotPromise ||= source.slice(0, source.size).then(bytes => { stable = new Blob([bytes]); });
      await snapshotPromise;
    },
  };
  return source;
}
