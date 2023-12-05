import { Cite, plugins } from "@citation-js/core";
import "@citation-js/plugin-bibtex";

import OrcidWork from "../orcid-work.js";
import Orcid from "../orcid.js";
import "./plugin-crossref.js";

import { CONFIG } from "../index.js";

export async function tryToParseCiteData(data, messageFn) {
  try {
    const cite = await new Cite.async(data);
    return cite.data[0];
  } catch (err) {
    if (CONFIG.debug) {
      console.warn(
        messageFn
          ? messageFn(data, err)
          : `Skipping citation with data "${data}": ${err.message}`
      );
      if (CONFIG.verbose) {
        console.log(err);
      }
    }
    return null;
  }
}

const orcid = new Orcid();

const formats = {
  "@orcid/id": {
    async parseAsync(orcidId) {
      const works = await orcid.fetchWorks(orcidId);
      const cites = (await Promise.all(works.map(tryToParseCiteData))).filter(
        (x) => x
      );
      return cites;
    },
    parseType: {
      dataType: "String",
      predicate: /^\d{4}-\d{4}-\d{4}-\d{4}$/,
    },
  },

  "@orcid/works": {
    async parseAsync({ orcidId, putCodes }) {
      const works = await orcid.fetchWorksByPutCodes(orcidId, putCodes);

      // Break the parse chain to catch parsing errors
      const worksData = await Promise.all(
        works.map(async (work) => {
          const messageFn = (work, err) => {
            let message = `Parsing error for ORCID work ${orcid.endpoint}${work.work.path}. Error: ${err.message}`;
            if (err.message.startsWith("invalid syntax")) {
              message = `${message}. This probably means that the BibTeX of the ORCID record contains a syntax error. Please check the BibTeX value of the ORCID record.`;
            }
            return message;
          };
          return await tryToParseCiteData(work, messageFn);
        })
      );
      return worksData.filter((work) => work);
    },
    parseType: {
      dataType: "SimpleObject",
      propertyConstraint: {
        props: ["orcidId", "putCodes"],
      },
    },
  },

  "@orcid/work": {
    parse(data) {
      const work = new OrcidWork(data.work);
      return work.bibtex || work.bibjson;
    },
    parseType: {
      dataType: "SimpleObject",
      propertyConstraint: {
        props: ["work"],
      },
    },
  },
};

plugins.add("@orcid", { input: formats });
