export const ENDPOINT = "https://pub.orcid.org/v3.0";
export const DELAY_AFTER_FETCH = 25;

export default class OrcidService {
  constructor(endpoint = ENDPOINT, delay = DELAY_AFTER_FETCH) {
    this.endpoint = endpoint;
    this.delay = delay;
  }

  wait() {
    return new Promise((result) => setTimeout(result, this.delay));
  }

  async fetch(path) {
    const url = `${this.endpoint}/${path}`;
    const headers = { accept: "application/json" };
    const response = await fetch(url, { headers });
    await this.wait();

    if (!response.ok) {
      return false;
    } else {
      const jsonData = await response.json();
      return jsonData;
    }
  }
}
