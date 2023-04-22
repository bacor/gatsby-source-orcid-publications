import Publication from "./publication.js";

//  General class for any source that returns Publications
export class Source {
  constructor(
    name,
    items,
    { filter = () => true, addSourceToItems = true } = {}
  ) {
    if (typeof name !== "string" || name === "") {
      throw new Error("Every source needs a name");
    }
    this.name = name;

    this.items = {};
    items.forEach((item) => {
      if (!(item instanceof SourceItem)) {
        throw new Error("Items should be SourceItems");
      }
      if (addSourceToItems) {
        item.sources.push(this.name);
      }
      if (filter(item)) {
        this.items[item.id] = item;
      }
    });
  }

  static async load() {
    // Return a Source instance
    throw new Error("Not implemented yet");
  }

  index(index) {
    return this.items[this.ids[index]];
  }

  get length() {
    return Object.keys(this.items).length;
  }

  get ids() {
    return Object.keys(this.items);
  }
}

export class SourceItem {
  constructor(data, { cache = false, refresh = false, ...opts } = {}) {
    this.sources = [];
    this.publication = null;
    this.cache = refresh === true ? false : cache;
    this.opts = opts;
    this.handleData(data);
  }

  get id() {
    throw new Error("Not implemented yet");
  }

  get lastModified() {
    return false;
  }

  handleData(data) {
    this.data = data;
  }

  async fetchPublication() {
    throw new Error("Not implemented yet");
  }

  async getPublication() {
    if (!this.publication) {
      const pub = await this.fetchPublication(this.opts);
      if (!(pub instanceof Publication)) {
        throw new Error("fetchPublication should return a Publication");
      }
      this.publication = pub;
    }
    return this.publication;
  }

  async getCache() {
    if (typeof this.cache == "object") {
      let cachedObj = await this.cache.get(this.id);
      return cachedObj ? cachedObj : false;
    } else {
      return false;
    }
  }

  async setCache(data) {
    if (this.cache !== false) {
      const obj = { data, id: this.id, lastModified: this.lastModified };
      return await this.cache.set(obj.id, obj);
    } else {
      return false;
    }
  }

  async export() {
    let cachedObj = await this.getCache();

    const refresh =
      cachedObj === false ||
      (this.lastModified !== false &&
        this.lastModified > cachedObj.lastModified);

    let data;
    if (refresh) {
      const pub = await this.getPublication();
      data = pub.export;
      await this.setCache(data);
    } else {
      data = cachedObj.data;
    }

    data.internalId = this.id;
    data.sources = this.sources;
    return data;
  }
}
