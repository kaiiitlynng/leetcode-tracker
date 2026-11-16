import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { notionAssetUrl, type NotionPage } from "@/lib/notion";

/** Server-rendered body of one Notion page: its property table, then the markdown. */
export default function NotionPageView({ page }: { page: NotionPage }) {
  return (
    <>
      {page.properties.length > 0 && (
        <dl className="peek-props">
          {page.properties.map((property) => (
            <div key={property.key}>
              <dt>{property.key}</dt>
              <dd>{property.value || <span className="dash">Empty</span>}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="prose">
        {page.body ? (
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              // eslint-disable-next-line @next/next/no-img-element
              img: ({ src = "", alt }) => <img src={notionAssetUrl(page.file, String(src))} alt={alt ?? ""} loading="lazy" />,
              a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>,
            }}
          >
            {page.body}
          </Markdown>
        ) : (
          <p className="muted">This page has no content.</p>
        )}
      </div>
    </>
  );
}
