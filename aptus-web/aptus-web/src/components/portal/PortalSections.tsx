"use client";

import { useAuth } from "@/context/AuthProvider";
import { getPortalData } from "@/lib/portal-data";
import { DashboardTopbar, MobileNav } from "./DashboardShell";

function StatusBadge({ status }: { status: string }) {
  const label = status || "Unknown";
  const isWarning = label.toLowerCase().includes("expiring") || label === "High";
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        isWarning ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
      }`}
    >
      {label}
    </span>
  );
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
}) {
  return (
    <div className="aptus-table-wrap overflow-x-auto">
      <table className="aptus-table w-full">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DashboardOverview() {
  const { user } = useAuth();
  if (!user) return null;
  const data = getPortalData(user);

  return (
    <>
      <DashboardTopbar
        title="Dashboard Overview"
        welcomeText={`Welcome back, ${user.name}. Here is your Aptus customer workspace.`}
      />
      <MobileNav />
      <div className="aptus-dashboard-content">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data.stats.map((stat) => (
            <div key={stat.label} className="aptus-stat-card">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="aptus-panel">
            <h3>Upcoming renewals</h3>
            <ul className="space-y-3">
              {data.renewals.slice(0, 2).map((r) => (
                <li key={r.id} className="flex justify-between gap-2 text-sm">
                  <span>
                    {r.product} — {r.dueDate}
                  </span>
                  <StatusBadge status={r.priority} />
                </li>
              ))}
            </ul>
          </div>
          <div className="aptus-panel">
            <h3>Recent purchases</h3>
            <ul className="space-y-3">
              {data.purchases.slice(0, 2).map((p) => (
                <li key={p.id} className="flex justify-between gap-2 text-sm">
                  <span>{p.product}</span>
                  <span className="text-gray-500">{p.amount}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

export function PurchasesSection() {
  const { user } = useAuth();
  if (!user) return null;
  const { purchases } = getPortalData(user);

  return (
    <>
      <DashboardTopbar title="Purchases" welcomeText={`Purchase history for ${user.company}.`} />
      <MobileNav />
      <div className="aptus-dashboard-content">
        <DataTable
          headers={["Order", "Product", "Date", "Amount", "Status"]}
          rows={purchases.map((p) => [
            p.id,
            p.product,
            p.date,
            p.amount,
            <StatusBadge key={p.id} status={p.status} />,
          ])}
        />
      </div>
    </>
  );
}

export function SubscriptionsSection() {
  const { user } = useAuth();
  if (!user) return null;
  const { subscriptions } = getPortalData(user);

  return (
    <>
      <DashboardTopbar title="Subscriptions" welcomeText={`Active licenses and subscriptions for ${user.company}.`} />
      <MobileNav />
      <div className="aptus-dashboard-content">
        <DataTable
          headers={["ID", "Product", "Seats", "Renews on", "Status"]}
          rows={subscriptions.map((s) => [
            s.id,
            s.product,
            String(s.seats),
            s.renewsOn,
            <StatusBadge key={s.id} status={s.status} />,
          ])}
        />
      </div>
    </>
  );
}

export function RenewalsSection() {
  const { user } = useAuth();
  if (!user) return null;
  const { renewals } = getPortalData(user);

  return (
    <>
      <DashboardTopbar title="Renewals" welcomeText={`Renewal pipeline for ${user.company}.`} />
      <MobileNav />
      <div className="aptus-dashboard-content">
        <DataTable
          headers={["ID", "Product", "Due date", "Amount", "Priority"]}
          rows={renewals.map((r) => [
            r.id,
            r.product,
            r.dueDate,
            r.amount,
            <StatusBadge key={r.id} status={r.priority} />,
          ])}
        />
      </div>
    </>
  );
}

export function ProfileSection() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <>
      <DashboardTopbar title="Profile" welcomeText={`Manage your account details for ${user.company}.`} />
      <MobileNav />
      <div className="aptus-dashboard-content">
        <div className="aptus-panel max-w-2xl">
          <h3>Account information</h3>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-gray-500">Full name</dt>
              <dd className="font-medium">{user.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Email</dt>
              <dd className="font-medium">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Company</dt>
              <dd className="font-medium">{user.company}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Role</dt>
              <dd className="font-medium">{user.role}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Phone</dt>
              <dd className="font-medium">{user.phone}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Account manager</dt>
              <dd className="font-medium">{user.accountManager}</dd>
            </div>
          </dl>
          <p className="mt-6 text-sm text-gray-500">
            Profile updates are stored in this demo only. Connect to your backend or Odoo to persist changes.
          </p>
        </div>
      </div>
    </>
  );
}
