// Renders one schema.org JSON-LD block. Structured data is how search
// engines learn what kind of business this is (a graphic design / creative
// production company), what it offers, and how its pages relate.
//
// This is the ONE deliberate dangerouslySetInnerHTML use on the public
// site: a <script type="application/ld+json"> body must be raw text, and
// React would otherwise escape it into invalid JSON. It is safe because the
// payload is always JSON.stringify output of a plain object (never HTML),
// and every character that could close the <script> element or break out of
// it ("<", ">", "&", U+2028, U+2029) is re-escaped to a \u sequence, which
// JSON parsers read back as the identical character. Browsers never execute
// a JSON-LD block, so it is unaffected by the script-src CSP.
const UNSAFE_CHARS: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, (char) => UNSAFE_CHARS[char]);
}

export default function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
