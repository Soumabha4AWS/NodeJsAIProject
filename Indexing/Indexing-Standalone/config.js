const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Use environment variable for API key. Do NOT commit secrets to source.
const OPENAI_API_KEY = '';
const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';
const OPENAI_LLM_MODEL = 'gpt-4o-mini';

// Load tickets
const ticketsPath = path.join(__dirname, 'synthetic_tickets.json');
const tickets = JSON.parse(fs.readFileSync(ticketsPath, 'utf-8'));

// Convert to simple document objects
const documents = tickets.map((ticket) => {
  const content = `Ticket ID: ${ticket.ticket_id}\nTitle: ${ticket.title}\nDescription: ${ticket.description}\nResolution: ${ticket.resolution}\nCategory: ${ticket.category}\nPriority: ${ticket.priority}`;
  return {
    id: ticket.ticket_id,
    text: content,
    metadata: {
      ticket_id: ticket.ticket_id,
      category: ticket.category,
      priority: ticket.priority,
      title: ticket.title,
    },
  };
});

module.exports = {
  OPENAI_API_KEY,
  OPENAI_EMBEDDING_MODEL,
  OPENAI_LLM_MODEL,
  documents,
};
