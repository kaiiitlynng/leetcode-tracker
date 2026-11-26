/** Shown the moment Problems is clicked, until the table arrives. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading problems">
      <header className="page-header"><h1 className="title">Problems</h1></header>
      <span className="skeleton skeleton-filters" />
      <div className="table-wrap">{Array.from({ length: 8 }, (_, index) => <span className="skeleton skeleton-row" key={index} />)}</div>
    </div>
  );
}
