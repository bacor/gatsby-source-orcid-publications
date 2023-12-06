import { distance } from "fastest-levenshtein";

/**
 * Normalize a DOI by removing the protocol and converting to lowercase.
 *
 * @param {string} doi The DOI to normalize
 * @return {string}
 */
export function normalizeDoi(doi) {
  return doi.toLowerCase().replace(/https?:\/\/doi.org\//, "");
}

/**
 * Determine whether two publications are identical by comparing their
 * (normalized) DOIs. If the DOIs are not available, return null.
 *
 * @param {Cite} a The first cite object
 * @param {Cite} b The second cite object
 * @return {(boolean|null)} whether the DOIs are the same or null if the DOIs
 */
export function compareDois(a, b) {
  const doiA = a._normDoi || a.DOI;
  const doiB = b._normDoi || b.DOI;
  if (doiA && doiB) {
    return doiA === doiB;
  } else {
    return null;
  }
}

/**
 * Test whether two citation objects have the same or similar titles.
 *
 * @param {Cite} a The first cite object
 * @param {Cite} b The second cite object
 * @param {int} [maxDist=3] The maximum Levenshtein distance between the titles
 * @param {int} [length=30] The maximum length of the titles
 * @return {(boolean|null)} whether the titles are the same/similar or
 * null if the titles are not available
 */
export function compareTitles(a, b, maxDist = 3, length = 30) {
  if (a.title && b.title) {
    const normTitle1 = a.title.toLowerCase().trim().slice(0, length);
    const normTitle2 = b.title.toLowerCase().trim().slice(0, length);
    return distance(normTitle1, normTitle2) <= maxDist;
  } else {
    return null;
  }
}

/**
 * Test whether two citation objects are identical using a series of
 * comparison functions. Each of these functions should return true if the
 * two items are identical, false if they are not identical, or null if the
 * function cannot determine whether the items are identical. These functions
 * are applied in order, and the first function that returns true or false
 * determines equality.
 *
 * By default, first the DOIs are compared, then the titles.
 *
 * @param {module:@citation-js/core/Cite} a The first citation object
 * @param {module:@citation-js/core/Cite} b The second citation object
 * @param {function[]} [testFns] A list of test functions
 * @return {boolean} true if the two items are equal
 */
export function compare(a, b, testFns = [compareDois, compareTitles]) {
  if (testFns.length === 0)
    throw new Error("Please provide at least one test function");
  for (const testFn of testFns) {
    const outcome = testFn(a, b);
    if (outcome === true || outcome === false) {
      return outcome;
    } else if (outcome === null) {
      continue;
    } else {
      throw new Error(
        `Invalid outcome ${outcome} of test function ${testFn}: test functions should return true, false, or null`
      );
    }
  }
  return false;
}

/**
 * Group an array of elements into equivalence classes, where equivalence
 * is determined by a series of test functions.
 *
 * We check for all items A whether it has duplicates in a set of candidates
 * If A turns out to be unique, we remove it from the candidates. If A has a
 * duplicate B, we register A.duplicates = B.duplicates = {A, B}
 * It is possible that the method of checking duplicates would identify A=B and B=C,
 * for some C, but not A=C. And so we should not remove B from the candidates,
 * so that we can still identify B=C and collect all duplicates {A, B, C}.
 * If `exhaustive == true`, we keep B in the candidates and thus do an exhaustive
 * check for duplicates. If `exhaustive == false`, we remove B from the candidates,
 * to reduce the number of candidates that need checking, at the possible cost of
 * missing some duplicates.
 *
 * @param {*} array The array of elements to group
 * @param {function[]} opts.testFns A list of test functions
 * @param {boolean} opts.exhaustive Whether to do an exhaustive search
 * @param {boolean} opts.debug Whether to print debug messages
 * @return {Set}
 */
export function groupDuplicates(
  array,
  { testFns, exhaustive = true, debug = false } = {}
) {
  const groups = {};
  const candidates = new Set([...Array(array.length).keys()]);
  candidates.forEach((a) => {
    groups[a] = new Set([a]);
  });

  let numComparisons = 0;
  candidates.forEach((a) => {
    candidates.forEach((b) => {
      if (a === b) return;
      if (groups[a].has(b)) return;

      numComparisons += 1;
      if (compare(array[a], array[b], testFns) === true) {
        groups[b].forEach((c) => groups[a].add(c));
        groups[b] = groups[a];
        if (exhaustive === false) {
          candidates.delete(b);
        }
      }
    });

    // Remove itemA from the candidates: it is unique
    if (groups[a].length === 1) {
      candidates.delete(a);
    }
  });

  const uniqueGroups = new Set([...Object.values(groups)]);
  if (debug) {
    console.log(
      `Found ${uniqueGroups.size} equivalence classes among ${array.length} items (in ${numComparisons} comparisons)`
    );
  }
  return uniqueGroups;
}
