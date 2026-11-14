// Einzelkern-Fairy im eigenen Worker: Nachrichten rein = UCI-Befehle, raus = Zeilen
importScripts('stockfish.js');
const early = [];
onmessage = (e) => early.push(e.data);
Stockfish().then((sf) => {
  sf.addMessageListener((line) => postMessage(line));
  onmessage = (e) => { if (e.data?.ini) sf.FS.writeFile('/blockmatt.ini', e.data.ini); else sf.postMessage(e.data); };
  for (const m of early) onmessage({ data: m });
  postMessage('__ready');
});
