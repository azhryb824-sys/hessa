import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import Activities from "@/components/dashboard/Activities";
export default function Page() {
  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="mr-72">
        <Header />
        <main className="workspace-main">
          <p className="eyebrow">رحلتك التعليمية</p>
          <h1>حصصك</h1>
          <p>احجز موعدًا مناسبًا، وتابع حصصك الفردية والجماعية.</p>
          <Activities kind="classes" />
        </main>
      </div>
    </div>
  );
}
