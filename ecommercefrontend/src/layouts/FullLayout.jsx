import Header from "./Header";

const FullLayout = ({ title, subtitle, onLogout, children }) => {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#ede9fe_0%,#e0e7ff_45%,#f8fafc_100%)] p-4 md:p-6">
      <section className="mx-auto max-w-5xl rounded-2xl border border-violet-100 bg-white p-6 shadow-xl">
        <Header title={title} subtitle={subtitle} onLogout={onLogout} />
        <div className="mt-6">{children}</div>
      </section>
    </main>
  );
};

export default FullLayout;
