/**
 * Tool: Check Health
 * Returns CPU and Memory usage for a given server.
 */
export function getServerHealth(serverId) {
  console.log(`-> TOOL: Checking health for ${serverId}...`);

  const metrics = {
    // Scenario 1: High CPU (Needs Restart)
    'payment-server-01': { cpu: '98%', memory: '40%', status: 'Warning' },
    // Scenario 2: Healthy (No Action Needed)
    'db-node-02': { cpu: '12%', memory: '60%', status: 'Healthy' },
    // Scenario 3: High Memory Leak (Needs Restart or Escalation)
    'auth-service-03': { cpu: '45%', memory: '95%', status: 'Critical' },
    // Scenario 4: Network/Dependency Failure (Needs Escalation)
    'search-index-09': { cpu: '10%', memory: '15%', status: 'Error' },
    // Scenario 5: Completely Normal
    'frontend-node-04': { cpu: '25%', memory: '30%', status: 'Healthy' },
  };

  const result = metrics[serverId] || { error: 'Server not found. Check the ID.' };
  return JSON.stringify(result);
}

/**
 * Tool: Fetch Recent Logs
 * Returns the last N lines of logs.
 */
export function fetchRecentLogs(serverId, lines = 5) {
  console.log(`-> TOOL: Fetching last ${lines} log lines for ${serverId}...`);

  const logDatabase = {
    'payment-server-01': [
      '[INFO] Request received /pay/v1',
      '[WARN] CPU threshold exceeded 90%',
      '[WARN] Thread pool exhaustion',
      '[CRITICAL] Process hung, not accepting new connections',
      '[ERROR] Timeout waiting for thread',
    ],
    'db-node-02': [
      '[INFO] Backup started',
      '[INFO] Backup completed successfully',
      '[INFO] User query executed in 12ms',
      '[INFO] Health check: OK',
      '[INFO] Replication sync active',
    ],
    'auth-service-03': [
      '[INFO] Token validated user_882',
      '[WARN] Garbage collection taking too long (>5s)',
      '[ERROR] java.lang.OutOfMemoryError: Java heap space',
      '[CRITICAL] Application crashing due to memory leak',
      '[INFO] Restarting context...',
    ],
    'search-index-09': [
      '[INFO] Indexing started',
      '[ERROR] Connection refused: elastic-cluster-main:9200',
      '[ERROR] Failed to write document ID 4432',
      '[CRITICAL] Dependency Unreachable: Search Engine is down',
      '[ERROR] Retrying in 30s...',
    ],
    'frontend-node-04': [
      '[INFO] GET /home 200 OK',
      '[INFO] GET /assets/logo.png 200 OK',
      '[INFO] GET /login 200 OK',
      '[INFO] GET /api/v1/status 200 OK',
      '[INFO] Health check passed',
    ],
  };

  const defaultLogs = ['[INFO] System stable', '[INFO] Heartbeat signal received'];
  const serverLogs = logDatabase[serverId] || defaultLogs;

  return JSON.stringify({ logs: serverLogs.slice(0, lines) });
}

/**
 * Tool: Restart Service
 * Restarts a service and returns confirmation.
 */
export function restartService(serverId) {
  console.log(`\nTOOL: Restarting service...`);
  return JSON.stringify({
    status: 'success',
    message: 'Server restarted successfully',
  });
}

/**
 * Tool: Escalate to Engineer
 * Escalates the issue to a human engineer.
 */
export function escalateToEngineer(summary) {
  console.log(`\nTOOL: Escalating to human...`);
  return JSON.stringify({
    status: 'success',
    message: 'The ticket was created successfully',
  });
}

/**
 * Map of available functions for the agent execution loop
 */
export const AVAILABLE_FUNCTIONS = {
  get_server_health: getServerHealth,
  fetch_recent_logs: fetchRecentLogs,
  restart_service: restartService,
  escalate_to_engineer: escalateToEngineer,
};
