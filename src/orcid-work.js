import slugify from "slugify";
import OrcidService from "./orcid-service.js";

export const ORCID_WORK_PROPERTIES = [
  "internalId",
  "orcidId",
  "putCode",
  "doi",
  "path",
  "lastModified",
  "created",
  "bibtex",
  "url",
  "type",
  "title",
  "subtitle",
  "translatedTitle",
  "year",
  "month",
  "day",
  "date",
  "journal",
  "authors",
  "language",
  "description",
  "bibjson",
];

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

function uid() {
  // https://stackoverflow.com/questions/3231459/how-can-i-create-unique-ids-with-javascript
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export default class OrcidWork {
  constructor(data, { internalId } = {}) {
    if (typeof data !== "object") {
      throw new TypeError("OrcidWork only accepts a data object as input");
    }
    this._internalId = internalId ? `${internalId}` : null;
    this.data = data;
  }

  static async load(orcidId, putCode, opts = {}) {
    const service = opts.service || new OrcidService();
    const path = `${orcidId}/work/${putCode}`;
    const data = await service.fetch(path);
    if (data === false) {
      return false;
    } else {
      return new OrcidWork(data, opts);
    }
  }

  get internalId() {
    if (!this._internalId) {
      const doi = this.doi;
      const title = this.title;
      const year = this.year;

      if (doi) {
        this._internalId = `doi:${doi}`;
      } else if (title && year) {
        const slug = slugify(title.slice(0, 40), { lower: true });
        this._internalId = `slug:${year}_${slug}`;
      } else if (this.path) {
        this._internalId = `path:${this.path}`;
      } else {
        this._internalId = `id:${uid()}`;
      }
    }
    return this._internalId;
  }

  get orcidId() {
    return this.path?.split("/")?.filter((x) => x)?.[0];
  }

  get putCode() {
    return this.data?.["put-code"];
  }

  get doi() {
    const externalIds = this.data?.["external-ids"]?.["external-id"] || [];
    const doiObj = externalIds.find((id) => id?.["external-id-type"] === "doi");
    if (doiObj) {
      return doiObj?.["external-id-normalized"]?.["value"];
    } else {
      return undefined;
    }
  }

  get path() {
    return this.data?.path;
  }

  get lastModified() {
    return this.data["last-modified-date"]?.value;
  }

  get created() {
    return this.data?.["created-date"]?.value;
  }

  get bibtex() {
    if (this.data?.citation?.["citation-type"] === "bibtex") {
      return this.data?.citation?.["citation-value"];
    } else {
      return undefined;
    }
  }

  get url() {
    return this.data?.url?.value;
  }

  get type() {
    return this.data?.type;
  }

  get title() {
    // TODO add subtitle?
    return this.data.title?.title?.value;
  }

  get subtitle() {
    return this.data.title?.subtitle?.value;
  }

  get translatedTitle() {
    return this.data.title?.translatedTitle;
  }

  get year() {
    return this.data?.["publication-date"]?.year?.value;
  }

  get month() {
    return this.data?.["publication-date"]?.month?.value;
  }

  get day() {
    return this.data?.["publication-date"]?.day?.value;
  }

  get date() {
    const [year, month, day] = [this.year, this.month, this.day];
    if (year && month && day) {
      return `${year}-${month}-${day}`;
    } else {
      return undefined;
    }
  }

  get journal() {
    return this.data?.["journal-title"]?.value;
  }

  // TODO Deal with editors
  get authors() {
    const authors = [];
    const contributors = this.data?.contributors?.contributor || [];
    for (let contributor of contributors) {
      const role =
        contributor?.["contributor-attributes"]?.["contributor-role"];
      const name = contributor?.["credit-name"]?.["value"];
      if (role === "author") {
        authors.push(name);
      }
    }
    return authors.length > 0 ? authors : undefined;
  }

  get language() {
    return this.data?.["language-code"];
  }

  get description() {
    return this.data?.["short-description"];
  }

  get bibjson() {
    const bibjson = {
      type: this.type,
      title: this.title,
      year: this.year,
      journal: { name: this.journal },
      link: [{ url: this.url }],
      identifier: this.doi ? [{ type: "doi", id: this.doi }] : [],
      authors: this.authors,
      abstract: this.description,
    };
    return bibjson;
  }
}
