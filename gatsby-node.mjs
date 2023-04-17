import OrcidFetcher from "./src/fetcher.js";
import OrcidService from "./src/service.js";
import Publication from "./src/publication.js";
import cliProgress from "cli-progress";

function replaceDois({ html, style }) {
  if (style === "apa") {
    const regex = /(https\:\/\/doi\.org\/([^<]+)\<\/div\>)/gm;
    const match = html.match(regex);
    if (match) {
      const url = match[0].replace("</div>", "");
      const doi = url.replace("https://doi.org/", "");
      const anchor = `
        <a href="${url}">
          <span className="doi-label">DOI</span> 
          <span className="doi-value">${doi}</span>
        </a>`;
      return html.replace(match[0], anchor);
    }
  }
  return html;
}

export async function sourceNodes(
  { actions, createContentDigest, createNodeId, cache },
  {
    // Required: a list of ORCID ids
    orcidIds,

    // Name of the citation style, defaults to 'apa'
    style = "apa", // 'vancouver', 'harvard1'

    // Optional: a custom CSL template. Only used if you also specify a
    // custom name using the `style` option above (not `apa`, `vancouver`
    // or `harvard1`)
    template = null,

    // Optional: locale, default 'en-US'
    // Suppported values: "en-US", "es-ES", "de-DE", "fr-FR", "nl-NL"
    locale = "en-US",

    // Optional, default false. If true, all works without bibtex or
    // doi are skipped. For other works the citation objects are constructed
    // from the work fields, but this often means some information will be missing.
    skipWithoutBibtexOrDoi = false,

    // Optional, default true. If True, doi's at the end of a HTML reference
    // are replaced by anchors. This only works if in the APA style.
    replaceDOIsByAnchors = true,

    // Optional: name for the GraphQL nodes
    nodeType = "Publication",

    // Optional: refresh the cache
    refresh = false,

    // Optional: ORCID endpoint
    endpoint = "https://pub.orcid.org/v3.0",

    // Optional: delay in ms between requests to ORCID
    delayAfterFetch = 25,
  } = {}
) {
  if (!orcidIds) {
    console.warn(
      `No bibitems were loaded: please specify one or more 
      ORCID ids in the plugin options`
    );
    return;
  }
  const { createNode } = actions;
  const service = new OrcidService(endpoint, delayAfterFetch);
  const fetcher = await OrcidFetcher.load(orcidIds, { service });

  // If the publication options have changed, refresh all publications
  const pubOpts = { style, locale, skipWithoutBibtexOrDoi };
  let cachedOpts = await cache.get("publication-options");
  if (
    style !== cachedOpts?.style ||
    locale !== cachedOpts?.locale ||
    skipWithoutBibtexOrDoi !== cachedOpts?.skipWithoutBibtexOrDoi
  ) {
    console.log(
      "Refreshing all publications, because the plugin options have changed"
    );
    await cache.set("publication-options", pubOpts);
    refresh = true;
  }

  // Show a progress bar
  const progressBar = new cliProgress.SingleBar(
    {
      hideCursor: true,
      forceRedraw: true,
      format:
        "publications [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}",
    },
    cliProgress.Presets.shades_classic
  );
  progressBar.start(fetcher.length, 0);
  let progress = 0;

  // Iterate over all summaries and only fetch full works if they have changed
  // since they were last cached
  for (const internalId of Object.keys(fetcher.uniqueSummaries)) {
    const summary = fetcher.uniqueSummaries[internalId];

    // Load object from cache or initialze a default object
    const cacheKey = `work-${summary.internalId}`;
    let cachedObj = await cache.get(cacheKey);
    if (!cachedObj) {
      cachedObj = { internalId, lastModified: 0, data: false };
    }

    // Update the object if it has been modified or needs to be refreshed
    if (cachedObj.lastModified < summary.lastModified || refresh) {
      const work = await summary.fetchFullWork({ service });
      const pub = await Publication.loadOrcidWork(work, {
        parentOrcidIds: summary.parentOrcidIds,
        template,
        processHTML: replaceDOIsByAnchors ? replaceDois : null,
        ...pubOpts,
      });
      cachedObj.data = pub.export;
      cachedObj.lastModified = work.lastModified;
      await cache.set(cacheKey, cachedObj);
    }

    // Create a node for the object
    if (cachedObj.data) {
      createNode({
        ...cachedObj.data,
        id: createNodeId(`${nodeType}-${internalId}`),
        parent: null,
        children: [],
        internal: {
          type: nodeType,
          contentDigest: createContentDigest(cachedObj.data),
        },
      });
    }

    progress += 1;
    progressBar.update(progress);
  }
  progressBar.stop();
}
