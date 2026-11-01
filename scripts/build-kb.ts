// Writes the assistant's library (src/knowledge/kb.json) from the app's own content.
// Usage: npm run kb
import { writeFileSync } from 'node:fs';
import { collectKnowledgeBase } from '../src/knowledge/collect';

const kb = collectKnowledgeBase();
writeFileSync('src/knowledge/kb.json', JSON.stringify(kb, null, 1) + '\n');
console.log(`Wrote src/knowledge/kb.json: ${kb.passages.length} passages from ${Object.keys(kb.docs).length} sources.`);
