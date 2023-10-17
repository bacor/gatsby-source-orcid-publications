import { Cite, plugins } from "@citation-js/core";
import "@citation-js/plugin-doi";
import "@citation-js/plugin-csl";
import "@citation-js/plugin-bibtex";

export const SUPPORTED_LOCALES = ["en-US", "es-ES", "de-DE", "fr-FR", "nl-NL"];

export default class Publication {
  constructor(
    cite,
    {
      template = null,
      style = "apa",
      locale = "en-US",
      processHTML = null,
      parentOrcidIds = [],
    } = {}
  ) {
    if (!(cite instanceof Cite)) {
      throw new TypeError("cite should be a Cite object.");
    }
    if (!SUPPORTED_LOCALES.includes(locale)) {
      throw new TypeError(`Locale '${locale}' is not supported.`);
    }

    if (template) {
      let config = plugins.config.get("@csl");
      config.templates.add(style, template);
    }

    // We no longer check whether the style is available:
    // const config = plugins.config.get("@csl");
    // const styles = Object.keys(config.templates.data)

    this.style = style;
    this.locale = locale;
    this.processHTML = processHTML;
    this._parentOrcidIds = parentOrcidIds;
    this._object;
    this.cite = cite;
  }

  static async load(data, opts = {}) {
    if (data instanceof Cite) {
      return new Publication(data, opts);
    } else {
      try {
        const cite = await Cite.async(data);
        return new Publication(cite, opts);
      } catch {
        // Occurs for example when a DOI is not found
        // e.g. 10.3389/conf.fnhum.2013.214.00030
        return false
      }
    }
  }

  static async loadOrcidWork(
    work,
    { skipWithoutBibtexOrDoi = false, ...opts } = {}
  ) {
    let pub = false;
    const bibtex = work.bibtex;
    if (bibtex) {
      try {
        pub = await Publication.load(work.bibtex, opts);
        return pub;
      } catch {
        // ...
      }
    }

    const doi = work.doi;
    if (!pub && doi) {
      try {
        pub = await Publication.load(work.doi, opts);
        return pub;
      } catch {
        // ...
      }
    }

    const bibjson = work.bibjson;
    if (!pub && bibjson && skipWithoutBibtexOrDoi === false) {
      try {
        pub = await Publication.load(bibjson, opts);
        return pub;
      } catch {
        // ...
      }
    }

    return false;
  }

  get html() {
    let html = this.cite.format("bibliography", {
      format: "html",
      template: this.style,
      locale: this.locale,
    });
    if (this.processHTML) {
      html = this.processHTML({ html, style: this.style, locale: this.locale });
    }
    return html;
  }

  get text() {
    const text = this.cite.format("bibliography", {
      format: "text",
      template: this.style,
      locale: this.locale,
    });
    return text;
  }

  get citation() {
    const citation = this.cite.format("citation", {
      format: "html",
      template: this.style,
      locale: this.locale,
    });
    return citation;
  }

  get bibtex() {
    const bibtex = this.cite.format("bibtex");
    return bibtex;
  }

  get object() {
    if (!this._object) {
      const objects = this.cite.format("data", { format: "object" });
      this._object = objects[0];
    }
    return this._object;
  }

  get year() {
    return this.object?.issued?.["date-parts"]?.[0]?.[0];
  }

  get export() {
    return {
      year: this.year,
      html: this.html,
      text: this.text,
      bibtex: this.bibtex,
      citation: this.citation,
      orcid_ids: this._parentOrcidIds,
      props: this.object,
    };
  }
}
