import { CONFIG } from "./src/index.js";
import ReferenceManager from "./src/manager.js";
import { registerCitationStyle } from "./src/utils.js";

const SUPPORTED_FORMATS = {
  bibtex: "@citation-js/plugin-bibtex",
  pubmed: "@citation-js/plugin-pubmed",
  ris: "@citation-js/plugin-ris",
  isbn: "@citation-js/plugin-isbn",
  wikidata: "@citation-js/plugin-wikidata",
  refer: "@citation-js/plugin-refer",
  refworks: "@citation-js/plugin-refworks",
  "software-formats": "@citation-js/plugin-software-formats",
};

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

    // Optional: name for the GraphQL nodes
    nodeType = "Publication",

    // Optional: refresh the cache
    refresh = false,

    // Optional: a function that takes a cite object and returns an object with custom fields
    customFields = () => ({}),
    outputTransform = (entry) => entry,

    // Recommended but optional: a name, email and domain that is passed to Crossref
    // to ensure polite usage of their API.
    serviceName = undefined,
    serviceEmail = undefined,
    serviceDomain = undefined,

    // prevent any logging
    silent = false,

    // No longer used
    // skipWithoutBibtexOrDoi = false,
    // orcidEndpoint = "https://pub.orcid.org/v3.0",
    // delayAfterFetch
    // replaceAnchorsByDois ==> can be achieved using the customTransform option
  } = {}
) {
  const { createNode } = actions;

  // Conditionally import plugins
  const formats = sources
    .map((source) => source.format)
    .filter((format) => format);
  for (let format in SUPPORTED_FORMATS) {
    if (formats.includes(format)) {
      await import(SUPPORTED_FORMATS[format]);
    }
  }

  // Global configuration options
  CONFIG.name = serviceName;
  CONFIG.email = serviceEmail;
  CONFIG.domain = serviceDomain;
  CONFIG.silent = silent;

  // Validate, fetch and use CSL style
  style = await registerCitationStyle(style, template);

  const cacheKey = "gatsby-source-publications";
  const twentyFourHours = 24 * 60 * 60 * 1000; // 86400000
  let obj = await cache.get(cacheKey);

  if (!obj || refresh || Date.now() - obj.lastUpdated > twentyFourHours) {
    // Create a manager and register all sources
    const manager = new ReferenceManager();
    for (let i = 0; i < sources.length; i++) {
      if (!silent) {
        console.log(
          `Retrieving publications from source "${sources[i].name || i}"...`
        );
      }
      await manager.add(sources[i]);
    }

    // Remove duplicated publicatioons
    manager.deduplicate();

    // Export all publications
    const publications = manager.output({
      style,
      locale,
      customFields,
      transform: outputTransform,
    });

    if (!silent) {
      console.log(
        `Retrieved a total of ${manager.cite.data.length} publications, adding the ${publications.length} unique ones.`
      );
    }

    // Update the cache
    obj = { publications, lastUpdated: Date.now() };
    await cache.set(cacheKey, obj);
  } else {
    if (!silent) {
      console.log(`Using ${obj.publications.length} cached publications`);
    }
  }

  // Create nodes for all publications
  for (const pub of obj.publications) {
    const { id, ...itemWithoutId } = pub;
    createNode({
      ...itemWithoutId,
      id: createNodeId(`${nodeType}-${id}`),
      parent: null,
      children: [],
      internal: {
        type: nodeType,
        contentDigest: createContentDigest(pub),
      },
    });
  }
}
