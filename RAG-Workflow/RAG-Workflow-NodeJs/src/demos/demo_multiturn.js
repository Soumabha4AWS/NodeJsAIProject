import '../config.js';
import { askWithHistory } from '../ragWithMultiturn.js';

const history = [];

const q1 = 'How do I fix authentication failures after a password reset?';
console.log(`Turn 1 — User: ${q1}`);
const a1 = await askWithHistory(q1, history);
console.log(` Assistant: ${a1.slice(0, 300)}${a1.length > 300 ? '...' : ''}`);
console.log(` [chat_history now has ${history.length} messages]`);

const q2 = 'What was the ticket ID for that issue?';
console.log(`\nTurn 2 — User: ${q2}`);
const a2 = await askWithHistory(q2, history);
console.log(` Assistant: ${a2.slice(0, 300)}${a2.length > 300 ? '...' : ''}`);
console.log(` [chat_history now has ${history.length} messages]`);

const q3 = 'What was the resolution for that ticket?';
console.log(`\nTurn 3 — User: ${q3}`);
const a3 = await askWithHistory(q3, history);
console.log(` Assistant: ${a3.slice(0, 300)}${a3.length > 300 ? '...' : ''}`);
console.log(` [chat_history now has ${history.length} messages]`);

console.log(`\n✓ History contains ${history.length} messages (${Math.floor(history.length / 2)} complete turns)`);
console.log('TIP: In production, cap history to avoid token bloat:');
console.log('   history = history.slice(-6)  // keep last 3 turns');
