import ProfileForm from "@/components/forms/user/ProfileForm";

export default function ProfilePage() {
  return (
    <div className="min-h-[calc(100vh-140px)] py-10 px-4 sm:px-6 lg:px-8">
      {/* Background Decorative Gradient Blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden"
      >
        <div className="w-lg h-lg rounded-full bg-primary/5 blur-3xl opacity-60 transform -translate-y-16" />
        <div className="w-96 h-96 rounded-full bg-indigo-200/20 blur-3xl opacity-50 transform translate-x-40 translate-y-32" />
      </div>

      <main className="w-full">
        <ProfileForm />
      </main>
    </div>
  );
}
