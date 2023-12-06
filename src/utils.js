import { plugins } from "@citation-js/core";

/**
 * Register a new CSL citation style to citation-js.
 *
 * @param {string} style Name of the style to use
 * @param {string} template Optional CSL template to use (https://...)
 * @return {string} the format name
 */
export async function registerCitationStyle(style, template) {
  const config = plugins.config.get("@csl");
  const styles = Object.keys(config.templates.data);

  // Use default style "apa", or "custom" if no name is passed for the template.
  if (!template && !style) {
    return "apa";
  } else if (template && (!style || styles.includes(style))) {
    style = "custom";
  }

  // Unknown style
  if (!template && !styles.includes(style)) {
    console.warn(`Invalid citation style "${style}", rolling back to APA.`);
    return "apa";
  }

  // Fetch CSL template
  if (template && template.startsWith("https://")) {
    const response = await fetch(template);
    if (!response.ok) {
      console.warn("Could not fetch CSL template; rolling back to APA style");
      return "apa";
    }
    template = await response.text();
  }

  // Register template
  if (template && template.startsWith("<?xml")) {
    config.templates.add(style, template);
  } else {
    console.warn("Invalid CSL template; rolling back to APA style");
    return "apa";
  }

  return style;
}
