// Supabase Edge Function to proxy SerpAPI requests
// This avoids CORS issues when calling SerpAPI from the browser

// @ts-ignore - Deno types are available in Supabase Edge Functions runtime
const SERPAPI_KEY = Deno.env.get('SERPAPI_KEY') || '8497ce60ccb34a61b7bb371343928ddf60dfa38ce0133f9810e06c7cf9f74cd8';
const SERPAPI_ENDPOINT = 'https://serpapi.com/search.json';

// @ts-ignore - Deno.serve is available in Supabase Edge Functions runtime
Deno.serve(async (req) => {
  // CORS headers for all origins including localhost
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400', // 24 hours
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const { engine, params } = await req.json();

    // Build query parameters
    const searchParams = new URLSearchParams({
      engine: engine || 'youtube',
      api_key: SERPAPI_KEY,
      ...params
    });

    // Make request to SerpAPI
    const response = await fetch(`${SERPAPI_ENDPOINT}?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`SerpAPI request failed: ${response.status}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('SerpAPI Proxy Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});
