import { Source } from "./source.js";

export class AggregateSource extends Source {
  static async load(name, sources, { filter, addSourceToItems = false } = {}) {
    const items = {};
    sources.forEach((source) => {
      if (!(source instanceof Source)) {
        throw new Error("Sources must be instances of the Source class");
      }

      source.ids.forEach((id) => {
        if (id in items) {
          items[id].sources.push(source.name);
        } else {
          items[id] = source.items[id];
        }
      });
    });

    return new AggregateSource(name, Object.values(items), {
      filter,
      addSourceToItems,
    });
  }
}
