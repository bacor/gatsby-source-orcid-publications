import { Source, SourceItem } from "./source.js";
import Publication from "./publication.js";

export class DOISourceItem extends SourceItem {
  async fetchPublication(opts = {}) {
    return await Publication.load(this.data, opts);
  }

  get id() {
    return `doi:${this.doi}`;
  }

  get doi() {
    return this.data.toLowerCase();
  }
}

export class DOISource extends Source {
  static async load(name, data, { cache, ...opts } = {}) {
    const items = data.map((doi) => new DOISourceItem(doi, { cache, ...opts }));
    return new DOISource(name, items, opts);
  }
}
