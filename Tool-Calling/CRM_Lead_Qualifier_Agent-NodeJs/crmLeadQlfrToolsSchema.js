const toolsSchema = [
  {
    type: "function",
    function: {
      name: "lookup_domain_info",
      description: "Retrieves general business information (industry, size, revenue) about a company based on its domain name.",
      parameters: {
        type: "object",
        properties: {
          domain: { type: "string", description: "The company's domain name, e.g., 'acmecorp.com'" },
        },
        required: ["domain"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_crm_history",
      description: "Checks the internal CRM system for past contact, status, and notes associated with a specific lead email.",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string", description: "The full email address of the lead." },
        },
        required: ["email"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate_lead_score",
      description: "Calculates the priority score (High/Medium/Low) for a lead based on a summary of all collected domain and CRM history data.",
      parameters: {
        type: "object",
        properties: {
          data_summary: { type: "string", description: "A JSON string containing the combined domain_info and crm_history." },
        },
        required: ["data_summary"],
      },
    },
  },
];

module.exports = { toolsSchema };