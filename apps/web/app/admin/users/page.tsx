import type { AdminUserDto } from "@auto-iq/contracts/admin";
import type { OffsetPaginatedResponse } from "@auto-iq/contracts/pagination";
import { ROUTES } from "@auto-iq/contracts/routes";
import { Users } from "lucide-react";
import { UserAccessAction } from "@/components/admin/user-access-action";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationFooter } from "@/components/shared/pagination-footer";
import { WorkspacePage } from "@/components/shared/workspace-page";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import {
  getSessionJson,
  isServerApiFailure,
  withQuery,
} from "@/lib/server-api";
import { labelizeEnum } from "@/lib/vehicle-ui";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Number(readValue(params.page) || "1") || 1;
  const search = readValue(params.search);
  const role = readValue(params.role);
  const access = readValue(params.access);
  const result = await getSessionJson<OffsetPaginatedResponse<AdminUserDto>>(
    withQuery(ROUTES.admin.users, {
      page,
      limit: 20,
      search,
      role,
      access,
      sortBy: "createdAt",
      sortDir: "DESC",
    }),
  );
  if (isServerApiFailure(result)) {
    return (
      <WorkspacePage>
        <ErrorBanner
          message={result.error.message}
          correlationId={result.error.correlationId}
        />
      </WorkspacePage>
    );
  }

  return (
    <WorkspacePage className="space-y-6">
      <PageHeader
        eyebrow="Tenant access"
        title="Users"
        description="Search tenant members and suspend or restore access with audited, deny-by-default controls."
      />
      <form className="grid gap-3 rounded-3xl border border-[var(--ink-100)] bg-white p-4 md:grid-cols-[1fr_12rem_12rem_auto]">
        <Input
          name="search"
          defaultValue={search}
          placeholder="Search name, email, or phone"
          aria-label="Search users"
        />
        <Select name="role" defaultValue={role} aria-label="Role">
          <option value="">All roles</option>
          {["BUYER", "SELLER", "INSPECTOR", "ADMIN"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </Select>
        <Select name="access" defaultValue={access} aria-label="Access">
          <option value="">All access</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </Select>
        <button className={buttonVariants({ variant: "amber" })}>Apply</button>
      </form>
      {result.data.data.length === 0 ? (
        <EmptyState
          icon={Users}
          headline="No users found"
          body="No tenant members match the selected filters."
        />
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-[var(--ink-100)] bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[var(--ink-50)] text-xs uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                <th className="p-4">Member</th>
                <th className="p-4">Role</th>
                <th className="p-4">Verification</th>
                <th className="p-4">Joined</th>
                <th className="p-4 text-right">Access</th>
              </tr>
            </thead>
            <tbody>
              {result.data.data.map((user) => (
                <tr key={user.id} className="border-t border-[var(--ink-100)]">
                  <td className="p-4">
                    <p className="font-semibold text-[var(--ink-900)]">
                      {user.fullName}
                    </p>
                    <p className="text-[var(--ink-500)]">
                      {user.email} · {user.phone}
                    </p>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline">{labelizeEnum(user.role)}</Badge>
                  </td>
                  <td className="p-4">
                    {user.emailVerified ? "Email" : "—"}
                    {user.phoneVerified ? " · Phone" : ""}
                  </td>
                  <td className="p-4">{formatDate(user.createdAt)}</td>
                  <td className="p-4 text-right">
                    <UserAccessAction user={user} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <PaginationFooter
        {...result.data.meta}
        buildHref={(nextPage) => usersHref(nextPage, search, role, access)}
      />
    </WorkspacePage>
  );
}

function readValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}
function usersHref(page: number, search: string, role: string, access: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (search) params.set("search", search);
  if (role) params.set("role", role);
  if (access) params.set("access", access);
  return params.size ? `/admin/users?${params}` : "/admin/users";
}
