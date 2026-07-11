import type { OffsetPaginatedResponse } from "@auto-iq/contracts/pagination";
import type { ReferenceDataResponse } from "@auto-iq/contracts/reference-data";
import { ROUTES } from "@auto-iq/contracts/routes";
import type { VehicleRequestDto } from "@auto-iq/contracts/vehicle-requests";
import { SearchCheck } from "lucide-react";
import { VehicleRequestForm } from "@/components/marketplace/vehicle-request-form";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationFooter } from "@/components/shared/pagination-footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatPrice } from "@/lib/format";
import {
  getSessionJson,
  isServerApiFailure,
  withQuery,
} from "@/lib/server-api";
import { labelizeEnum } from "@/lib/vehicle-ui";

export default async function VehicleRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = Number((await searchParams).page ?? "1") || 1;
  const [requestsResult, referenceResult] = await Promise.all([
    getSessionJson<OffsetPaginatedResponse<VehicleRequestDto>>(
      withQuery(ROUTES.vehicleRequests.buyerList, { page, limit: 12 }),
    ),
    getSessionJson<ReferenceDataResponse>(ROUTES.referenceData.all),
  ]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Buyer sourcing"
        title="Request a vehicle"
        description="Tell us what you need when the right vehicle is not yet in the catalogue."
      />
      {isServerApiFailure(requestsResult) ? (
        <ErrorBanner
          message={requestsResult.error.message}
          correlationId={requestsResult.error.correlationId}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>What are you looking for?</CardTitle>
            </CardHeader>
            <CardContent>
              <VehicleRequestForm
                referenceData={
                  referenceResult.ok
                    ? referenceResult.data
                    : emptyReferenceData()
                }
              />
            </CardContent>
          </Card>
          <div className="space-y-4">
            {requestsResult.data.data.length === 0 ? (
              <EmptyState
                icon={SearchCheck}
                headline="No sourcing requests yet"
                body="Your submitted requests and their progress appear here."
              />
            ) : (
              requestsResult.data.data.map((request) => (
                <Card key={request.id}>
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="warning">
                        {labelizeEnum(request.status)}
                      </Badge>
                      <span className="text-xs text-[var(--ink-400)]">
                        {formatDate(request.createdAt)}
                      </span>
                    </div>
                    <p className="font-semibold text-[var(--ink-900)]">
                      Budget up to{" "}
                      {formatPrice(request.maxBudgetCents / 100, "ZWG")}
                    </p>
                    <p className="text-sm text-[var(--ink-500)]">
                      {[
                        request.makeName,
                        request.model,
                        request.yearMin && `${request.yearMin}+`,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Open preferences"}
                    </p>
                    {request.adminNote ? (
                      <p className="text-sm text-[var(--ink-500)]">
                        Update: {request.adminNote}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
      {!isServerApiFailure(requestsResult) &&
      requestsResult.data.data.length > 0 ? (
        <PaginationFooter
          page={requestsResult.data.meta.page}
          totalPages={requestsResult.data.meta.totalPages}
          limit={requestsResult.data.meta.limit}
          total={requestsResult.data.meta.total}
          buildHref={(nextPage) =>
            nextPage > 1 ? `/requests?page=${nextPage}` : "/requests"
          }
        />
      ) : null}
    </main>
  );
}

function emptyReferenceData(): ReferenceDataResponse {
  return {
    makes: [],
    bodyTypes: [],
    fuelTypes: [],
    transmissionTypes: [],
    driveTypes: [],
    viewingLocations: [],
  };
}
