import { distance } from "fastest-levenshtein";
import { Cite } from "@citation-js/core";
import "@citation-js/plugin-csl";
import "@citation-js/plugin-doi";

import "./plugins/plugin-file.js";
import "./plugins/plugin-orcid.js";

export function normalizeDoi(doi) {
  return doi.toLowerCase().replace(/https?:\/\/doi.org\//, "");
}

export function compareDois(a, b) {
  const doiA = a._normDoi || a.DOI;
  const doiB = b._normDoi || b.DOI;
  if (doiA && doiB) {
    return doiA === doiB;
  } else {
    return null;
  }
}

export function compareTitles(a, b, maxDist = 3, length = 30) {
  if (a.title && b.title) {
    const normTitle1 = a.title.toLowerCase().trim().slice(0, length);
    const normTitle2 = b.title.toLowerCase().trim().slice(0, length);
    return distance(normTitle1, normTitle2) <= maxDist;
  } else {
    return null;
  }
}

export function compare(a, b, testFns = [compareDois, compareTitles]) {
  if (testFns.length === 0)
    throw new Error("Please provide at least one test function");

  // Test equality of two items a and b, using a list of test functions.
  // The first function that returns true or false determines the outcome;
  // if no function can determine equality, the function returns false.
  for (const testFn of testFns) {
    const outcome = testFn(a, b);
    if (outcome === true || outcome === false) {
      return outcome;
    } else if (outcome === null) {
      continue;
    } else {
      throw new Error(
        `Invalid outcome ${outcome} of test function ${testFn}: test functions should return true, false, or null`
      );
    }
  }
  return false;
}

export function groupDuplicates(
  array,
  { testFns, exhaustive = true, debug = false } = {}
) {
  // We check for all items A whether they have duplicates in a set of candidates
  // If A turns out to be unique, we remove it from the candidates. If A has a
  // duplicate B, we register A.duplicates = B.duplicates = {A, B}
  // It is possible that the method of checking duplicates would identify A=B and B=C,
  // for some C, but not A=C. And so we should not remove B from the candidates,
  // so that we can still identify B=C and collect all duplicates {A, B, C}.
  // If `exhaustive == true`, we keep B in the candidates and thus do an exhaustive
  // check for duplicates. If `exhaustive == false`, we remove B from the candidates,
  // to reduce the number of candidates that need checking, at the possible cost of
  // missing some duplicates.
  const groups = {};
  const candidates = new Set([...Array(array.length).keys()]);
  candidates.forEach((a) => {
    groups[a] = new Set([a]);
  });

  let numComparisons = 0;
  candidates.forEach((a) => {
    candidates.forEach((b) => {
      if (a === b) return;
      if (groups[a].has(b)) return;

      numComparisons += 1;
      if (compare(array[a], array[b], testFns) === true) {
        groups[b].forEach((c) => groups[a].add(c));
        groups[b] = groups[a];
        if (exhaustive === false) {
          candidates.delete(b);
        }
      }
    });

    // Remove itemA from the candidates: it is unique
    if (groups[a].length === 1) {
      candidates.delete(a);
    }
  });

  const uniqueGroups = new Set([...Object.values(groups)]);
  if (debug) {
    console.log(
      `Found ${uniqueGroups.size} equivalence classes among ${array.length} items (in ${numComparisons} comparisons)`
    );
  }
  return uniqueGroups;
}

export default class ReferenceManager {
  constructor() {
    this.cite = new Cite();
    this.sources = {};
  }

  async add({
    data,
    name,
    exclude,
    // filters = [],
    priority = 0,
    ...props
  } = {}) {
    let cite;
    // Test if this is an ORCID ID
    try {
      cite = await new Cite.async(data);
    } catch (err) {
      console.warn(err);
    }

    // Add source to citation objects
    cite.data.forEach((item) => {
      item._sources = [name];
      item._duplicates = new Set([item]);
      if (item.DOI) item._normDoi = normalizeDoi(item.DOI);
    });

    // Register source so we can trace where each citation came from
    name = name || `source_${Object.keys(this.sources).length}`;
    this.sources[name] = {
      type: cite.data[0]._graph[0].type,
      items: cite.data,
      priority,
      ...props,
    };

    // Combine exclusion filters
    if (exclude) {
      let rules = exclude.map((rule) => {
        if (typeof rule === "function") {
          return rule;
        } else if (typeof rule === "object") {
          if (rule.field && rule.values) {
            // e.g. { field: "DOI", values: ['10.006/...', '10.007/...'] }
            return (item) =>
              item[rule.field] && rule.values.includes(item[rule.field]);
          } else if (rule.field && rule.regexp) {
            // e.g. { field: "title", regexp: "A grandiose critique*" }
            return (item) => {
              return item[rule.field] && item[rule.field].match(rule.regexp);
            };
          } else if (rule.before || rule.after) {
            // e.g. { before: 2010, after: 2020 }
            return (item) => {
              try {
                const before = rule.before || -99999;
                const after = rule.after || 99999;
                const year = item.issued["date-parts"][0][0];
                return year < before || year > after;
              } catch {
                return false;
              }
            };
          }
        }
      });

      // Filter function: true if none of the exclusion rules apply to an item
      const filterFn = (item) => rules.map((fn) => !fn(item)).every(Boolean);
      this.cite.data.push(...cite.data.filter(filterFn));
    } else {
      // Add source to citation objects
      this.cite.data.push(...cite.data);
    }
  }

  resolveDuplicates(items) {
    // Compute the priority of each item: the priority of
    // the highest-priority source (usually item._sources contains only one source)
    const priorities = items.map((item) =>
      Math.max(...item._sources.map((s) => this.sources[s]?.priority || 0))
    );
    const index = priorities.indexOf(Math.max(...priorities));
    return items[index];
  }

  deduplicate({ resolveFn, inPlace = true, ...opts } = {}) {
    const groups = groupDuplicates(this.cite.data, opts);
    let resolver = resolveFn || ((items) => this.resolveDuplicates(items));
    const uniqueRefs = [...groups].map((group) => {
      const items = [...group].map((index) => this.cite.data[index]);
      const resolved = resolver(items);
      resolved._sources = items.flatMap((item) => item._sources);
      return resolved;
    });

    if (inPlace) this.cite.data = uniqueRefs;
  }

  output({
    style = "apa",
    locale = "en-US",
    customFields = () => ({}), // customFields should take the cite object and return an object with custom fields
    transform = (entry) => entry,
  } = {}) {
    const opts = { template: style, locale };

    // First format as text to get the order of the references
    const entries = {};
    const textEntries = this.cite.format("bibliography", {
      format: "text",
      asEntryArray: true,
      ...opts,
    });
    textEntries.forEach((entry, i) => {
      entries[entry[0]] = { text: entry[1], order: i };
    });

    // Add HTML
    this.cite
      .format("bibliography", {
        format: "html",
        asEntryArray: true,
        ...opts,
      })
      .forEach((entry) => {
        entries[entry[0]].html = entry[1];
      });

    // Then export all other fields
    this.cite.data.forEach((item) => {
      const cite = new Cite(item);
      const entry = {
        ...entries[item.id],
        id: item.id,
        year: item.issued?.["date-parts"]?.[0]?.[0],
        sources: item._sources,
        props: cite.format("data", { format: "object", ...opts })[0],
        citation: cite.format("citation", opts),
        bibtex: cite.format("bibtex", opts).trim(),
        ...customFields(cite),
      };
      entries[entry.id] = transform(entry);
    });

    return Object.values(entries);
  }
}
