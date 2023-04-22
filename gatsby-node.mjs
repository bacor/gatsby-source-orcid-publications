import fs from "fs";
import cliProgress from "cli-progress";
import { plugins } from "@citation-js/core";
import OrcidService from "./src/orcid-service.js";
import { OrcidSource } from "./src/source-orcid.js";
import { DOISource } from "./src/source-doi.js";
import { BibTexSource } from "./src/source-bibtex.js";
import { AggregateSource } from "./src/source-aggregate.js";

const SOURCE_TYPES = ["orcid", "doi", "bibtex"];

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

function setupSources(sources) {
  return sources.map((source, i) => {
    if (!source?.type || !SOURCE_TYPES.includes(source.type)) {
      throw new Error(`Source number ${i} has invalid type "${source.type}"`);
    }
    if (!source?.name) {
      throw new Error(`Source number ${i} has no name`);
    }
    if (source.type === "orcid" && !source?.orcidId) {
      throw new Error(`Please specify the orcidId for source "${source.name}"`);
    }
    if (source.type === "doi" && !source?.DOIs) {
      throw new Error(`Please specify the DOIs for source "${source.name}"`);
    }
    if (source.type === "bibtex" && !(source?.bibtex || source?.path)) {
      throw new Error(
        `Please specify either a path or a bibtex string to source "${source.name}"`
      );
    }

    // Load bitex
    if (source.type == "bibtex" && source.path) {
      const bibtex = fs.readFileSync(source.path, {
        encoding: source.encoding || "utf-8",
      });
      source.bibtex = bibtex;
    }

    // Combine filters
    if ("excludeDOIs" in source || "filter" in source) {
      let filters = [];
      if ("excludeDOIs" in source) {
        const excludeDoisFilter = (item) =>
          !source["excludeDOIs"].includes(item.doi);
        filters.push(excludeDoisFilter);
      }
      if ("filter" in source) {
        filters.push(source.filter);
      }
      source.filter = (item) => filters.map((fn) => fn(item)).every(Boolean);
    }

    return source;
  });
}

async function setupCitationStyle(style, template) {
  const config = plugins.config.get("@csl");
  const styles = Object.keys(config.templates.data);

  // Use default style "apa", or "custom" if no name is passed for the template.
  if (!template && !style) {
    return "apa";
  } else if (template && (!style || styles.includes(style))) {
    style = "custom";
  }

  // Unknown style
  if (!template && !styles.includes(style)) {
    console.warn(`Invalid citation style "${style}", rolling back to APA.`);
    return "apa";
  }

  // Fetch CSL template
  if (template && template.startsWith("https://")) {
    const response = await fetch(template);
    if (!response.ok) {
      console.warn("Could not fetch CSL template; rolling back to APA style");
      return "apa";
    }
    template = await response.text();
  }

  // Register template
  if (template && template.startsWith("<?xml")) {
    config.templates.add(style, template);
  } else {
    console.warn("Invalid CSL template; rolling back to APA style");
    return "apa";
  }

  return style;
}

export async function sourceNodes(
  { actions, createContentDigest, createNodeId, cache },
  {
    // Required: a list of source dictionaries.
    sources,

    // Name of the citation style, defaults to 'apa'. Ignored if a custom template
    // is specified. (Or, to be more precise, it is only used internally, as a name
    // for the custom template)
    style = null, // 'apa', 'vancouver', 'harvard1'

    // Optional: a custom CSL template. You can pass the url of an xml file
    // or an XML string.
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
  const { createNode } = actions;

  // Validate the input
  sources = setupSources(sources);

  // Validate, fetch and use CSL style
  style = await setupCitationStyle(style, template);

  // Set up an Orcid service
  const service = new OrcidService(endpoint, delayAfterFetch);

  // Instantiate all sources
  const sourceObjects = await Promise.all(
    sources.map(async (source) => {
      const opts = {
        filter: source.filter,
        cache,
        service,
        refresh,
        style,
        locale,
        skipWithoutBibtexOrDoi,
        processHTML: replaceDOIsByAnchors ? replaceDois : null,
      };

      switch (source.type) {
        case "orcid":
          return await OrcidSource.load(source.name, source.orcidId, opts);

        case "doi":
          return await DOISource.load(source.name, source.DOIs, opts);

        case "bibtex":
          return await BibTexSource.load(source.name, source.bibtex, opts);
      }
    })
  );

  // Combine all sources into one source
  const aggregate = await AggregateSource.load("aggregate", sourceObjects);

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
  progressBar.start(aggregate.length, 0);
  let progress = 0;

  // Export all items and create nodes
  for (const id of aggregate.ids) {
    const item = aggregate.items[id];
    const publication = await item.export();
    if (publication) {
      createNode({
        ...publication,
        id: createNodeId(`${nodeType}-${id}`),
        parent: null,
        children: [],
        internal: {
          type: nodeType,
          contentDigest: createContentDigest(publication),
        },
      });
    }

    progress += 1;
    progressBar.update(progress);
  }

  progressBar.stop();
}
