import { Source, SourceItem } from "./source.js";
import Publication from "./publication.js";
import { Cite } from "@citation-js/core";
import slugify from "slugify";

export class BibTexSourceItem extends SourceItem {
  async fetchPublication(opts = {}) {
    return await Publication.load(this.data, opts);
  }

  get id() {
    const doi = this.doi;
    if (doi) {
      return `doi:${doi}`;
    } else if (this.title && this.year) {
      const slug = slugify(this.title.slice(0, 40), { lower: true });
      return `slug:${this.year}_${slug}`;
    } else {
      return `key:${this.citationKey}`;
    }
  }

  get doi() {
    const doi = this.data?.["DOI"];
    return doi ? doi.toLowerCase() : undefined;
  }

  get citationKey() {
    return this.data?.["citation-key"];
  }

  get title() {
    return this.data?.["title"];
  }

  get year() {
    return this.data.issued?.["date-parts"]?.[0]?.[0];
  }
}

export class BibTexSource extends Source {
  static async load(name, data, { cache, ...opts } = {}) {
    const cite = await Cite.async(data);
    const items = cite.data.map(
      (bibjson) => new BibTexSourceItem(bibjson, { cache, ...opts })
    );
    return new BibTexSource(name, items, opts);
  }
}
