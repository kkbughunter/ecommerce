import Header from "./Header";

const FullLayout = ({ title, subtitle, onLogout, children }) => {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#ede9fe_0%,#e0e7ff_45%,#f8fafc_100%)] px-2 py-0 md:px-3">
      <section className="w-full rounded-none border-y border-violet-100 bg-white p-6 shadow-xl">
        <Header title={title} subtitle={subtitle} onLogout={onLogout} />
        <div className="mt-6">{children}</div>
      </section>
    </main>
  );
};

export default FullLayout;
