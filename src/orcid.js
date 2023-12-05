import cliProgress from "cli-progress";
import Crossref from "./crossref.js";
import OrcidWork from "./orcid-work.js";
import { CONFIG } from "./index.js";

export const ENDPOINT = "https://pub.orcid.org/v3.0";
export const DELAY_AFTER_FETCH = 25;

const crossref = new Crossref({
  service: CONFIG.service,
  email: CONFIG.email,
  domain: CONFIG.domain,
});

export default class OrcidService {
  constructor(endpoint = ENDPOINT, delay = DELAY_AFTER_FETCH) {
    this.endpoint = endpoint;
    this.delay = delay;
  }

  wait() {
    return new Promise((result) => setTimeout(result, this.delay));
  }

  async fetch(path) {
    const url = `${this.endpoint}/${path}`;
    const headers = { accept: "application/json" };
    const response = await fetch(url, { headers });
    await this.wait();

    if (!response.ok) {
      return false;
    } else {
      const jsonData = await response.json();
      return jsonData;
    }
  }

  async fetchSummaries(orcidId) {
    const overview = await this.fetch(`${orcidId}/works`);
    const summaries = overview.group.map(
      (record) => new OrcidWork(record["work-summary"][0])
    );
    return summaries;
  }

  async fetchWorksByPutCodes(
    orcidId,
    putCodes,
    { chunkSize = 100, onProgress = () => {} } = {}
  ) {
    const works = [];
    for (let i = 0; i < putCodes.length; i += chunkSize) {
      const chunk = putCodes.slice(i, i + chunkSize);
      const path = `${orcidId}/works/${chunk.join(",")}`;
      const res = await this.fetch(path);
      const chunkWorks = res.bulk || res.group;
      works.push(...chunkWorks);
      onProgress(chunkWorks.length);
    }
    return works;
  }

  async fetchWorks(orcidId) {
    // Fetch summaries and split by whether they have a DOI
    const summaries = await this.fetchSummaries(orcidId);
    const summariesWithDOI = summaries.filter((work) => work.doi);
    const summariesWithoutDOI = summaries.filter((work) => !work.doi);

    // Log and start progress bar
    console.log(
      `>  Fetching ${summaries.length} works from ORCID "${orcidId}" of which ${summariesWithDOI.length} have DOIs.`
    );
    const bar = new cliProgress.SingleBar(
      {
        hideCursor: true,
        forceRedraw: true,
        format: "[{bar}] {percentage}% | ETA: {eta}s | {value}/{total}",
      },
      cliProgress.Presets.shades_classic
    );
    bar.start(summaries.length);
    const onProgress = (inc) => bar.increment(inc);

    // Fetch works with dois
    const dois = summariesWithDOI.map((work) => work.doi);
    const worksWithDOI = await crossref.fetchDOIsBatch(dois, { onProgress });

    // Fetch works without dois
    const putCodes = summariesWithoutDOI.map((work) => work.putCode);
    const worksWithoutDOI = await this.fetchWorksByPutCodes(orcidId, putCodes, {
      onProgress,
    });

    // Try to parse all works, but skip those that fail
    const works = [...worksWithDOI, ...worksWithoutDOI].filter((x) => x);
    bar.stop();
    console.log(`>  Retrieved ${works.length} works.`);
    return works;
  }
}
