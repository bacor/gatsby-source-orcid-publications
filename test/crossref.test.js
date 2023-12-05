import Crossref from "../src/crossref"
import { VERSION } from "../src"

test("user agent", () => {
  const api = new Crossref({
    name: "Test",
    domain: "https://test.com",
    email: "my@test.com"
  })
  expect(api.userAgent).toBe(`Test (https://test.com; mailto:my@test.com) using gatsby-source-publications/${VERSION}`)
})

test("no user agent", () => {
  const api = new Crossref()
  expect(api.userAgent).toBe(`Untitled service using gatsby-source-publications/${VERSION}`)
})

test("fetch doi", async () => {
  const doi = "10.31234/osf.io/qjfpe"
  const api = new Crossref()
  const res = await api.fetchDOI(doi)
  console.log(res)
})

test("polite user pool", async () => {
  const api = new Crossref({
    service: "Test",
    domain: "https://test.com",
    email: "my@test.com"
  })
  expect(api.polite).toBe(false)
  await api.fetchDOI("10.1007/s10071-023-01763-4")
  expect(api.polite).toBe(true)
})

test("fetch dois one by one", async () => {
  const dois = [
    "10.31234/osf.io/qjfpe", 
    "10.1177/10298649221149109",
    "10.1007/s10071-023-01763-4",
    "10.1016/j.ijpsycho.2015.02.024",
  ]
  const api = new Crossref()
  const works = await api.fetchDOIs(dois)
  expect(works.length).toBe(4)
})

test("fetch dois in a batch", async () => {
  const dois = [
    "10.31234/osf.io/qjfpe", 
    "10.1177/10298649221149109",
    "10.1007/s10071-023-01763-4",
    "10.1016/j.ijpsycho.2015.02.024",
  ]
  const api = new Crossref()
  const works = await api.fetchDOIsBatch(dois)
  expect(works.length).toBe(4)
})