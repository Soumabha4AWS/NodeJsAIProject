const mockDomainData = {
  "acmecorp.com": { industry: "Software/SaaS", size: "501-1000 employees", revenue: "$50M - $100M" },
  "widgetco.net": { industry: "Manufacturing", size: "100-250 employees", revenue: "$10M - $25M" },
  "globalfin.org": { industry: "Financial Services", size: "5000+ employees", revenue: "$1B+" },
};

const mockCrmData = {
  "jane@acmecorp.com": { last_contact: "2025-11-15", status: "Cold Lead", notes: "Attended webinar, no follow-up yet." },
  "bob@widgetco.net": { last_contact: "2025-12-01", status: "Active Opportunity", notes: "Discussed Q1 budget and product integration." },
  default: { last_contact: "N/A", status: "No Record", notes: "New lead, first contact opportunity." },
};

function lookupDomainInfo(domain) {
  console.log(`-> TOOL ACTIVATED: Looking up domain info for ${domain}...`);
  const info = mockDomainData[domain] || { industry: "Unknown", size: "N/A", revenue: "N/A" };
  return JSON.stringify(info);
}

function checkCrmHistory(email) {
  console.log(`-> TOOL ACTIVATED: Checking CRM history for ${email}...`);
  const history = mockCrmData[email] || mockCrmData.default;
  return JSON.stringify(history);
}

function calculateLeadScore(dataSummary) {
  console.log("-> TOOL ACTIVATED: Calculating lead score...");
  const data = JSON.parse(dataSummary);
  let score = "Low";

  if (data.domain_info?.revenue?.startsWith("$1B+")) {
    score = "High";
  } else if (data.crm_history?.status === "Active Opportunity") {
    score = "High";
  } else if (data.domain_info?.revenue?.startsWith("$50M")) {
    score = "Medium";
  }

  return JSON.stringify({ lead_score: score });
}

const AVAILABLE_FUNCTIONS = {
  lookup_domain_info: lookupDomainInfo,
  check_crm_history: checkCrmHistory,
  calculate_lead_score: calculateLeadScore,
};

module.exports = { AVAILABLE_FUNCTIONS, lookupDomainInfo, checkCrmHistory, calculateLeadScore };