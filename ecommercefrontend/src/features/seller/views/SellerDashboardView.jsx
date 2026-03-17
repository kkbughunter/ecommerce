import { useState } from "react";
import { Link } from "react-router-dom";
import AppFooter from "../../../layouts/AppFooter";

const NAV_ITEMS = [
    {
        key: "profile",
        label: "My Profile",
        path: "/seller/profile",
        icon: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
    },
];

const ADMIN_ACTIONS = [
    {
        key: "products",
        label: "Manage Products",
        description: "Create, edit, and activate products.",
        path: "/seller/dashboard/products",
    },
    {
        key: "orders",
        label: "Manage Orders",
        description: "Review orders and update statuses.",
        path: "/seller/dashboard/orders",
    },
    {
        key: "payments",
        label: "Payments",
        description: "Track payment attempts and timelines.",
        path: "/seller/dashboard/payments",
    },
    {
        key: "invoices",
        label: "Invoices",
        description: "Access invoice records.",
        path: "/seller/dashboard/invoices",
    },
];

const SellerDashboardView = () => {
    const [activeTab, setActiveTab] = useState("profile");

    const currentItem = NAV_ITEMS.find((item) => item.key === activeTab);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-bold text-slate-900">
                        Seller Dashboard
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Manage your seller profile and operations
                    </p>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-6 lg:flex-row">
                    {/* Sidebar Navigation */}
                    <nav className="w-full shrink-0 lg:w-64">
                        <div className="rounded-lg bg-white shadow-sm">
                            <div className="divide-y divide-slate-200">
                                {NAV_ITEMS.map((item) => {
                                    const isActive = activeTab === item.key;
                                    return (
                                        <Link
                                            key={item.key}
                                            to={item.path}
                                            onClick={() =>
                                                setActiveTab(item.key)
                                            }
                                            className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                                                isActive
                                                    ? "bg-blue-50 text-blue-700"
                                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            }`}
                                        >
                                            <svg
                                                className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-slate-400"}`}
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d={item.icon} />
                                            </svg>
                                            <span className="font-medium">
                                                {item.label}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </nav>

                    {/* Content Area */}
                    <div className="flex-1">
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            {currentItem ? (
                                <div>
                                    <h2 className="mb-4 text-lg font-semibold text-slate-900">
                                        {currentItem.label}
                                    </h2>
                                    {activeTab === "profile" && (
                                        <ProfileSummary />
                                    )}
                                </div>
                            ) : (
                                <p className="text-slate-500">
                                    Select an option from the menu
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <section className="mt-8">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Seller Operations
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                        Access the seller console to manage catalog and orders.
                    </p>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        {ADMIN_ACTIONS.map((action) => (
                            <Link
                                key={action.key}
                                to={action.path}
                                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                            >
                                <h3 className="text-sm font-semibold text-slate-900">
                                    {action.label}
                                </h3>
                                <p className="mt-1 text-xs text-slate-600">
                                    {action.description}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>
            </main>

            <AppFooter />
        </div>
    );
};

const ProfileSummary = () => (
    <div className="space-y-4">
        <p className="text-slate-600">
            Manage your business information that customers will see on your
            seller profile.
        </p>
        <p className="text-xs text-slate-500">
            Payment gateway settings are managed by Super Admins.
        </p>
        <div className="flex gap-4">
            <Link
                to="/seller/profile"
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
                {">"} View & Edit Profile
            </Link>
        </div>
    </div>
);

export default SellerDashboardView;
