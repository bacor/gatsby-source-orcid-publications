import OrcidService from "./service.js";
import OrcidWorkSummary from "./work-summary.js";

export default class OrcidWorkCollection {
  static async load(orcid_id, { service } = {}) {
    service = service || new OrcidService();
    const data = await service.fetch(`${orcid_id}/works`);
    if (data === false) {
      return false;
    } else {
      return new OrcidWorkCollection(data["group"], orcid_id);
    }
  }

  constructor(summaries, orcidId = null) {
    this.orcidId = orcidId;
    this._summaries = {};
    summaries.forEach((data) => {
      const summary = new OrcidWorkSummary(data);
      summary.parentOrcidIds.push(this.orcidId);
      this._summaries[summary.internalId] = summary;
    });
  }

  get internalIds() {
    return Object.keys(this._summaries);
  }

  get length() {
    return this.internalIds.length;
  }

  *summaries() {
    for (const id of this.internalIds) {
      yield this._summaries[id];
    }
  }
}
