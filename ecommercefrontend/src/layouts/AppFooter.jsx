const AppFooter = () => {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-white/80">
      <div className="w-full px-2 py-4 text-center text-xs text-slate-500 md:px-3">
        (c) {new Date().getFullYear()} Villpo Store. All rights reserved.
      </div>
    </footer>
  );
};

export default AppFooter;
