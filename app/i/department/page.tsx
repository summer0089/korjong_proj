import DepartmentForm from "@/components/forms/master/Department";

export default function DepartmentPage() {
    return (
        <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
            {/* Background Decorative Gradient Blobs for Large Screens */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden"
            >
                <div className="w-125 h-125 rounded-full bg-primary/5 blur-3xl opacity-70 transform -translate-y-12" />
                <div className="w-100 h-100 rounded-full bg-rose-200/20 blur-3xl opacity-50 transform translate-x-32 translate-y-24" />
            </div >

            {/* Main Centered Container */}
            < main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10" >
                <DepartmentForm />
            </main >
        </div >
    );
}