/** Shown the moment Today is clicked, until its list arrives. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading today’s reviews">
      <header className="page-header"><h1 className="title">Today</h1></header>
      <div className="today-list">{Array.from({ length: 5 }, (_, index) => <span className="skeleton skeleton-row" key={index} />)}</div>
    </div>
  );
}
