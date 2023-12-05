import { VERSION, CONFIG } from "./index.js";

export default class Crossref {
  constructor({
    email = CONFIG.email,
    domain = CONFIG.domain,
    name = CONFIG.name,
  } = {}) {
    this.delayBetweenRequests = 20;
    this.polite = false;

    // Spectify user agent to be in the polite pool
    const parts = [name];
    if (email || domain) {
      if (email) email = `mailto:${email}`;
      parts.push(`(${[domain, email].filter((x) => x).join("; ")})`);
    }
    parts.push(`using gatsby-source-publications/${VERSION}`);
    this.userAgent = parts.join(" ");
    console.log(this.userAgent)
  }

  wait() {
    return new Promise((result) =>
      setTimeout(result, this.delayBetweenRequests)
    );
  }

  async fetch({
    path,
    headers = {},
    endpoint = "https://api.crossref.org",
  } = {}) {
    const url = `${endpoint}/${path}`;
    headers = {
      "User-Agent": this.userAgent,
      ...headers,
    };
    const response = await fetch(url, { headers });
    await this.wait();

    if (!response.ok) {
      console.warn(`Crossref request failed: status ${response.status} `);
      return false;
    } else {
      try {
        // Update rate limits based on response headers
        this.polite = response.headers.get("x-api-pool") == "polite";
        const limit = parseInt(response.headers.get("x-rate-limit-limit"));
        const interval = parseInt(
          response.headers.get("x-rate-limit-interval").slice(0, -1)
        );
        this.delayBetweenRequests = (interval / limit) * 1000 + 2; // add margin of 2ms
      } catch {}
      return await response.json();
    }
  }

  async fetchDOI(doi) {
    const headers = { Accept: "application/vnd.citationstyles.csl+json" };
    const work = await this.fetch({
      path: doi,
      headers,
      endpoint: "https://doi.org",
    });
    return work;
  }

  async fetchDOIs(dois, onProgress = () => {}) {
    dois = [...new Set(dois)];
    const works = [];
    for (const doi of dois) {
      try {
        const work = await this.fetchDOI(doi);
        onProgress();
        works.push(work);
      } catch (err) {
        console.warn(`Could not fetch DOI "${doi}": ${err.message}`);
      }
    }
    return works;
  }

  async fetchDOIsBatch(dois, { onProgress = () => {} } = {}) {
    const headers = {};
    const works = [];
    const chunkSize = 20;
    for (let i = 0; i < dois.length; i += chunkSize) {
      const chunk = dois.slice(i, i + chunkSize);
      const path = `works?filter=${chunk.map((doi) => `doi:${doi}`).join(",")}`;
      const data = await this.fetch({ path, headers });
      if (data) {
        works.push(...data.message.items);
        onProgress(data.message.items.length);
      } else {
        console.warn("Crossref request failed");
      }
    }

    if (CONFIG.debug) {
      console.log(`Fetched ${works.length}/${dois.length} works from crossref`);
    }

    // Try to fetch missing works
    const retrievedWorks = works.map((work) => work.DOI);
    const missingDOIs = dois.filter((doi) => !retrievedWorks.includes(doi));
    const missingWorks = await this.fetchDOIs(missingDOIs, onProgress);
    if (CONFIG.debug) {
      console.log(
        `Fetched ${missingWorks.length}/${missingDOIs.length} missing works via doi.org`
      );
    }

    return [...works, ...missingWorks];
  }
}
