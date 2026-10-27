export const toolsSchema = [
  {
    type: 'function',
    function: {
      name: 'get_server_health',
      description: 'Checks the current CPU and memory usage of a specific server.',
      parameters: {
        type: 'object',
        properties: {
          server_id: {
            type: 'string',
            description: "The ID of the server, e.g., 'payment-server-01'",
          },
        },
        required: ['server_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fetch_recent_logs',
      description: 'Retrieves the most recent log entries from a server to diagnose errors.',
      parameters: {
        type: 'object',
        properties: {
          server_id: {
            type: 'string',
            description: 'The ID of the server.',
          },
          lines: {
            type: 'integer',
            description: 'Number of log lines to fetch.',
          },
        },
        required: ['server_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'restart_service',
      description:
        'Restarts a service when CPU or memory usage is critically high.',
      parameters: {
        type: 'object',
        properties: {
          server_id: {
            type: 'string',
            description: 'The ID of the server.',
          },
        },
        required: ['server_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'escalate_to_engineer',
      description:
        'Escalates the issue to a human engineer when automated fixes fail or the error is unknown.',
      parameters: {
        type: 'object',
        properties: {
          summary: {
            type: 'string',
            description: 'The summary of the server issue.',
          },
        },
        required: ['summary'],
      },
    },
  },
];
