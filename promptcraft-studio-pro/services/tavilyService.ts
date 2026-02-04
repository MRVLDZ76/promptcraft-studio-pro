// Tavily Web Search Service (Direct API Implementation)
// Provides AI-optimized web search for fact-checking and source discovery

// Configuration - Compatible with both Vite and Node environments
const getTavilyKey = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.TAVILY_API_KEY || import.meta.env.VITE_TAVILY_API_KEY;
  }
  return process.env.TAVILY_API_KEY || process.env.VITE_TAVILY_API_KEY;
};

const TAVILY_API_KEY = getTavilyKey();
const TAVILY_API_URL = "https://api.tavily.com/search";
const MAX_RESULTS_PER_QUERY = 5;

/**
 * Call Tavily API directly with fetch
 */
async function callTavilyAPI(query: string, maxResults: number) {
  if (!TAVILY_API_KEY) {
    console.warn("TAVILY_API_KEY not found - search will be disabled");
    return { results: [] };
  }

  try {
    const response = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        max_results: maxResults,
        search_depth: "basic",
        include_answer: false,
      }),
    });

    if (!response.ok) {
      console.error(`Tavily API error: ${response.status}`);
      return { results: [] };
    }

    return await response.json();
  } catch (error) {
    console.error("Tavily API call failed:", error);
    return { results: [] };
  }
}

/**
 * Search web for information about a topic or claim
 */
export async function searchWeb(query: string, maxResults?: number): Promise<WebSearchResult[]> {
  try {
    const apiResponse = await callTavilyAPI(query, maxResults || MAX_RESULTS_PER_QUERY);
    
    if (!apiResponse.results || !Array.isArray(apiResponse.results)) {
      return [];
    }

    return apiResponse.results.map((result: any) => ({
      title: result.title || "",
      url: result.url || "",
      content: result.content || "",
      score: result.score || 0,
    }));
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

/**
 * Search for sources to verify multiple claims
 */
export async function searchForClaims(
  claims: string[],
  resultsPerClaim: number = 3
): Promise<Map<string, WebSearchResult[]>> {
  const results = new Map<string, WebSearchResult[]>();

  for (const claim of claims) {
    const searchResults = await searchWeb(claim, resultsPerClaim);
    results.set(claim, searchResults);
  }

  return results;
}

/**
 * Find authoritative sources for fact-checking
 */
export async function findAuthoritativeSources(query: string): Promise<AuthoritativeSource[]> {
  try {
    const apiResponse = await callTavilyAPI(query, 10);
    
    if (!apiResponse.results || !Array.isArray(apiResponse.results)) {
      return [];
    }

    return apiResponse.results
      .map((result: any) => ({
        title: result.title || "",
        url: result.url || "",
        content: result.content || "",
        score: result.score || 0,
        authority: calculateAuthority(result.url || ""),
      }))
      .sort((a, b) => b.authority - a.authority)
      .slice(0, 5);
  } catch (error) {
    console.error("Error finding authoritative sources:", error);
    return [];
  }
}

/**
 * Search for counterarguments to a position
 */
export async function searchCounterarguments(position: string): Promise<WebSearchResult[]> {
  const queries = [
    `arguments against ${position}`,
    `criticism of ${position}`,
  ];

  const allResults: WebSearchResult[] = [];

  for (const query of queries) {
    const results = await searchWeb(query, 2);
    allResults.push(...results);
  }

  // Deduplicate by URL
  const uniqueResults = Array.from(new Map(allResults.map((r) => [r.url, r])).values());
  return uniqueResults.slice(0, 5);
}

/**
 * Search for evidence supporting a claim
 */
export async function searchEvidence(claim: string): Promise<WebSearchResult[]> {
  const query = `evidence that ${claim}`;
  return await searchWeb(query, 5);
}

/**
 * Batch search multiple queries efficiently
 */
export async function batchSearch(
  queries: string[],
  maxResultsPerQuery: number = 3
): Promise<BatchSearchResult[]> {
  const results: BatchSearchResult[] = [];

  for (const query of queries) {
    const searchResults = await searchWeb(query, maxResultsPerQuery);
    results.push({
      query,
      results: searchResults,
      timestamp: new Date().toISOString(),
    });
  }

  return results;
}

/**
 * Calculate authority score for a URL
 */
function calculateAuthority(url: string): number {
  let score = 50; // Base score
  const domain = url.toLowerCase();

  // Academic sources
  if (domain.includes(".edu") || domain.includes("scholar.google")) {
    score += 30;
  }

  // Government sources
  if (domain.includes(".gov")) {
    score += 25;
  }

  // Established media
  const establishedMedia = [
    "reuters.com",
    "apnews.com",
    "bbc.com",
    "nytimes.com",
    "theguardian.com",
    "wsj.com",
    "npr.org",
  ];
  if (establishedMedia.some((media) => domain.includes(media))) {
    score += 20;
  }

  // Scientific journals
  const journals = [
    "nature.com",
    "science.org",
    "cell.com",
    "nejm.org",
    "thelancet.com",
  ];
  if (journals.some((journal) => domain.includes(journal))) {
    score += 35;
  }

  // Fact-checking sites
  const factCheckers = ["snopes.com", "factcheck.org", "politifact.com"];
  if (factCheckers.some((checker) => domain.includes(checker))) {
    score += 25;
  }

  // Penalize low-quality sources
  const lowQuality = ["blog", "wordpress.com", "medium.com"];
  if (lowQuality.some((lq) => domain.includes(lq))) {
    score -= 20;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Estimate search cost
 */
export function estimateSearchCost(numberOfQueries: number): number {
  return numberOfQueries * 0.001; // $0.001 per query
}

// Types
export interface WebSearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface AuthoritativeSource extends WebSearchResult {
  authority: number;
}

export interface BatchSearchResult {
  query: string;
  results: WebSearchResult[];
  timestamp: string;
}
