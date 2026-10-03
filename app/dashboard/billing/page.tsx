import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import Billing from "@/components/Billing";
export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="mr-72">
        <Header />
        <main className="workspace-main">
          <Billing />
        </main>
      </div>
    </div>
  );
}
