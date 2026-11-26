/** Shown the moment a problem is opened, until its attempts arrive. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading problem">
      <header className="page-header"><span className="skeleton skeleton-title" /></header>
      <div className="grid stats">{Array.from({ length: 4 }, (_, index) => <span className="skeleton skeleton-stat" key={index} />)}</div>
      <span className="skeleton skeleton-heading" style={{ margin: "48px 0 16px" }} />
      <span className="skeleton skeleton-block" />
    </div>
  );
}
