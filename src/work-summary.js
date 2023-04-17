import OrcidWork from "./work.js";

export const ORCID_WORK_SUMMARY_PROPERTIES = [
  "internalId",
  "lastmodified",
  "created",
  "orcidId",
  "putCode",
  "path",
  "doi",
  "type",
  "title",
  "journal",
  "year",
];

export default class OrcidWorkSummary {
  constructor(data, { internalId } = {}) {
    this.data = data;
    this.info = this.data?.["work-summary"]?.[0] || {};
    this._work = new OrcidWork(this.info, { internalId });
    this.parentOrcidIds = [];
  }

  async fetchFullWork({ service } = {}) {
    if (!this.orcidId || !this.putCode) {
      console.warn(`Cannot fetch full work without orcidId and putCode`);
      return false;
    } else {
      const work = await OrcidWork.load(this.orcidId, this.putCode, {
        service,
      });
      return work;
    }
  }

  get internalId() {
    return this._work.internalId;
  }

  get lastModified() {
    return this._work.lastModified;
  }

  get created() {
    return this._work.created;
  }

  get orcidId() {
    return this._work.orcidId;
  }

  get putCode() {
    return this._work.putCode;
  }

  get path() {
    return this._work.path;
  }

  get doi() {
    return this._work.doi;
  }

  get type() {
    return this._work.type;
  }

  get title() {
    return this._work.title;
  }

  get journal() {
    return this._work.journal;
  }

  get year() {
    return this._work.year;
  }
}
