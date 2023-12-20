import { Cite } from "@citation-js/core";
import "@citation-js/plugin-csl";
import "@citation-js/plugin-doi";
import "./plugins/plugin-file.js";
import "./plugins/plugin-orcid.js";
import { normalizeDoi, groupDuplicates } from "./compare.js";

/**
 * Turn an array of exclusion rules into an array of test functions, each
 * returning true if an item should be excluded.
 *
 * Typical usage:
 *
 *  {
 *    exclude: [
 *      { field: "DOI", values: ['10.006/...', '10.007/...'] },
 *      { field: "title", regexp: "A grandiose critique*" },
 *      { before: 2010, after: 2020 },
 *      (item) => item.title.length < 5
 *    ]
 *   }
 *
 * @param {object[]} exclude An array of exclude rules
 * @return {function[]} An array of functions that return true if an item should be excluded
 */
function exclusionRules(exclude) {
  return exclude.map((rule) => {
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
}

/**
 * A class that manages references from multiple sources. It tracks the source
 * each publication came from, and also allows you to remove duplicates. In that
 * case it registers all sources a publication was found in. Finally, it exports
 * publications to ordered, formatted references.
 */
export default class ReferenceManager {
  constructor() {
    this.cite = new Cite();
    this.sources = {};
  }

  /**
   * Add a new source to the reference manager. You can pass any type of data
   * that can be parsed by citation-js. You can also pass various exclusion rules
   * that allow you to exclude certain publications (see exclusionRules). Finally,
   * each source can have a priority. If a publication appears in multiple sources,
   * the publication from the source with the highest priority is kept.
   *
   * @param {*} opts.data Any type of data that can be parsed by citation-js
   * @param {string} opts.name The name of the source
   * @param {object[]} opts.exclude An array of exclusion rules, see exclusionRules()
   * @param {number} opts.priority The priority of this source (default: 0)
   */
  async add({ data, name, exclude, priority = 0, ...props } = {}) {
    let cite;
    try {
      cite = await Cite.async(data);
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

    if (exclude) {
      // Filter function: true if none of the exclusion rules apply to an item
      const rules = exclusionRules(exclude);
      const filterFn = (item) => rules.map((fn) => !fn(item)).every(Boolean);
      this.cite.data.push(...cite.data.filter(filterFn));
    } else {
      this.cite.data.push(...cite.data);
    }
  }

  /**
   * Resolve duplicates by returning the one from the highest-priority source.
   *
   * @param {Cite[]} items An array of publications
   * @returns {Cite}
   */
  resolveDuplicates(items) {
    const priorities = items.map((item) =>
      Math.max(...item._sources.map((s) => this.sources[s]?.priority || 0))
    );
    const index = priorities.indexOf(Math.max(...priorities));
    return items[index];
  }

  /**
   * Remove all duplicate publications. By default, the publication from the
   * highest-priority source is kept. You can pass a custom resolve function
   * to change this behaviour.
   *
   * @param {function} opts.resolveFn A function that takes an array of duplicate items
   * And returns the item that should be kept. By default, the item with
   * the highest priority will be kept.
   * @param {*} opts.others Other arguments are passed to groupDuplicates()
   */
  deduplicate({ resolveFn, ...opts } = {}) {
    const groups = groupDuplicates(this.cite.data, opts);
    let resolver = resolveFn || ((items) => this.resolveDuplicates(items));
    const uniqueRefs = [...groups].map((group) => {
      const items = [...group].map((index) => this.cite.data[index]);
      const resolved = resolver(items);
      resolved._sources = items.flatMap((item) => item._sources);
      return resolved;
    });
    this.cite.data = uniqueRefs;
  }

  /**
   * Export all publications as an array of objects.
   *
   * @param {string} opts.style The citation style to use (default: apa)
   * @param {string} opts.locale The locale (default: en-US)
   * @param {function} opts.customFields A function that takes a citation object
   * and returns an object with custom fields. This is applied to every publication
   * before it is exported.
   * @param {function} opts.transform A function that takes a citation object
   * and returns a transformed citation object. You might for example use this to
   * transform the HTML output and turn a DOI into an anchor element.
   * @returns
   */
  output({
    style = "apa",
    locale = "en-US",
    customFields = () => ({}),
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
