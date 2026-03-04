const AdminStatCard = ({ label, value, tone = "violet" }) => {
  const toneClasses = {
    violet: "border-violet-200 bg-violet-50 text-violet-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    slate: "border-slate-200 bg-slate-50 text-slate-800",
  };

  const style = toneClasses[tone] || toneClasses.slate;

  return (
    <article className={`rounded-xl border p-4 ${style}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.08em]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </article>
  );
};

export default AdminStatCard;
