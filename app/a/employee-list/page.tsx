import UserManagementForm from "@/components/forms/user/EmployeeListForm";

export default async function UserManagementStandardPage() {

  return (
    <div className=" min-h-[calc(100vh-140px)] py-6 sm:py-8">
      {/* Background Decorative Gradient Blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden"
      >
        <div className="w-125 h-125 rounded-full bg-primary/5 blur-3xl opacity-70 transform -translate-y-12" />
        <div className="w-100 h-100 rounded-full bg-indigo-200/20 blur-3xl opacity-50 transform translate-x-32 translate-y-24" />
      </div>

      <main className="w-full">
        <UserManagementForm />
      </main>
    </div>
  );
}
