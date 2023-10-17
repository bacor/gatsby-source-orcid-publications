import { OrcidSource } from "../src/source-orcid";
import { DOISourceItem } from "../src/source-doi";

test("special character in 10.1016/j.ijpsycho.2015.02.024", async () => {
  // https://github.com/bacor/mcg/issues/169
  const doi = "10.1016/j.ijpsycho.2015.02.024"
  const orcidSource = await OrcidSource.load("honing", "0000-0001-7046-7923", {
    filter: (item) => item.doi == doi,
  });
  const orcidItem = orcidSource.items[`doi:${doi}`]
  const orcidPub = await orcidItem.getPublication();
  // Note: this is not what you want: TÃ¶rÃ¶k
  expect(orcidPub.text.trim()).toBe(`Háden, G. P., Honing, H., Török, M., & Winkler, I. (2015). Detecting the temporal structure of sound sequences in newborn infants. International Journal of Psychophysiology, 96(1), 23–28. https://doi.org/10.1016/j.ijpsycho.2015.02.024`)

  // The issue does not occur sing a DOISourceItem (probably because it does not use the Orcid API, but the CrossRef API)
  const doiItem = new DOISourceItem(doi);
  const doiPub = await doiItem.getPublication();
  expect(doiPub.text.trim()).toBe(`Háden, G. P., Honing, H., Török, M., & Winkler, I. (2015). Detecting the temporal structure of sound sequences in newborn infants. International Journal of Psychophysiology, 96(1), 23–28. https://doi.org/10.1016/j.ijpsycho.2015.02.024`)
})

test("missing DOI", async () => {
  // https://github.com/bacor/mcg/issues/159
  const doi = "10.3389/fnins.2018.00475"
  const source = await OrcidSource.load("honing", "0000-0001-7046-7923", {
    filter: (item) => item.doi == doi
  });
  const item = source.items[`doi:${doi}`]
  const pub = await item.getPublication();
  // expect(pub.text.trim()).toBe(`Honing, H., Bouwer, F. L., Prado, L., & Merchant, H. (2018). Rhesus Monkeys (Macaca mulatta) sense isochrony in rhythm, but not the beat: Additional support for the gradual audiomotor evolution hypothesis. Frontiers in Neuroscience, 12(JUL).`)
  expect(pub.text.trim()).toBe(`Honing, H., Bouwer, F. L., Prado, L., & Merchant, H. (2018). Rhesus Monkeys (Macaca mulatta) Sense Isochrony in Rhythm, but Not the Beat: Additional Support for the Gradual Audiomotor Evolution Hypothesis. Frontiers in Neuroscience, 12. https://doi.org/10.3389/fnins.2018.00475`)


  const doiItem = new DOISourceItem(doi);
  const doiPub = await doiItem.getPublication();
  expect(doiPub.text.trim()).toBe(`Honing, H., Bouwer, F. L., Prado, L., & Merchant, H. (2018). Rhesus Monkeys (Macaca mulatta) Sense Isochrony in Rhythm, but Not the Beat: Additional Support for the Gradual Audiomotor Evolution Hypothesis. Frontiers in Neuroscience, 12. https://doi.org/10.3389/fnins.2018.00475`)
})

test("issue with nonexistent DOI", async () => {
  const doi = "10.3389/conf.fnhum.2013.214.00030"
  const doiItem = new DOISourceItem(doi);
  const doiPub = await doiItem.getPublication();
  expect(doiPub).toBeFalsy()
})