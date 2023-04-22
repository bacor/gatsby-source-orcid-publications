import { Source, SourceItem } from "./source.js";
import Publication from "./publication.js";
import OrcidService from "./orcid-service.js";
import OrcidWork from "./orcid-work.js";

export class OrcidSourceItem extends SourceItem {
  handleData({ data, orcidId }) {
    this.orcidId = orcidId;
    this.data = data;
    const info = this.data?.["work-summary"]?.[0] || {};
    this._work = new OrcidWork(info);
  }

  async fetchPublication(opts = {}) {
    if (!this.orcidId || !this.putCode) {
      console.warn(`Cannot fetch full work without orcidId and putCode`);
      return false;
    } else {
      const work = await OrcidWork.load(this.orcidId, this.putCode, {
        service: this.opts?.service,
      });
      return await Publication.loadOrcidWork(work, opts);
    }
  }

  get id() {
    return this._work.internalId;
  }

  get lastModified() {
    return this._work.lastModified;
  }

  get created() {
    return this._work.created;
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

export class OrcidSource extends Source {
  static async load(name, orcidId, { service, cache, ...opts } = {}) {
    service = service || new OrcidService();
    const data = await service.fetch(`${orcidId}/works`);
    if (data === false) {
      return false;
    } else {
      const items = data["group"].map(
        (itemData) =>
          new OrcidSourceItem({ data: itemData, orcidId }, { cache, ...opts })
      );
      return new OrcidSource(name, items, opts);
    }
  }
}
