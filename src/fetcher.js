import OrcidWorkCollection from "./work-collection.js";

export default class OrcidFetcher {
  constructor() {
    this._collections = {};
    this._uniqueSummaries;
  }

  static async load(orcidIds, { service } = {}) {
    const uniqueIds = [...new Set(orcidIds)];
    const fetcher = new OrcidFetcher();
    await Promise.all(
      uniqueIds.map(async (id) => {
        const collection = await OrcidWorkCollection.load(id, { service });
        fetcher._collections[id] = collection;
        return collection;
      })
    );
    return fetcher;
  }

  collection(orcidId) {
    return this._collections[orcidId];
  }

  *collections() {
    for (const orcidId of Object.keys(this._collections)) {
      yield this.collection(orcidId);
    }
  }

  *allSummaries({ skipDuplicates = true } = {}) {
    const summaryIds = new Set();
    for (const collection of this.collections()) {
      for (const summary of collection.summaries()) {
        if (skipDuplicates === false || !summaryIds.has(summary.internalId)) {
          summaryIds.add(summary.internalId);
          yield summary;
        } else {
          summary.parentOrcidIds.push(collection);
        }
      }
    }
  }

  get uniqueSummaries() {
    if (!this._uniqueSummaries) {
      this._uniqueSummaries = {};
      for (const collection of this.collections()) {
        for (const summary of collection.summaries()) {
          // Check for duplicates
          if (!(summary.internalId in this._uniqueSummaries)) {
            this._uniqueSummaries[summary.internalId] = summary;
          } else {
            const storedSummary = this._uniqueSummaries[summary.internalId];
            storedSummary.parentOrcidIds.push(collection.orcidId);
          }
        }
      }
    }
    return this._uniqueSummaries;
  }

  get length() {
    return Object.keys(this.uniqueSummaries).length;
  }
}
