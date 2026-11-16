import LogForm from "./form";

export default function LogPage() {
  return (
    <div className="narrow">
      <header className="page-header">
        <h1 className="title">Log an attempt</h1>
      </header>
      <LogForm />
    </div>
  );
}
