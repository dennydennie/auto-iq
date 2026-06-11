import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditLogEntity } from "./entity/audit-log.entity";
import { AdminActionLogEntity } from "./entity/admin-action-log.entity";
import { ApprovedViewingLocationEntity } from "./entity/approved-viewing-location.entity";
import { BuyerProfileEntity } from "./entity/buyer-profile.entity";
import { InspectionFindingEntity } from "./entity/inspection-finding.entity";
import { InspectionReportEntity } from "./entity/inspection-report.entity";
import { InspectionTaskEntity } from "./entity/inspection-task.entity";
import { NotificationAttemptEntity } from "./entity/notification-attempt.entity";
import { NotificationEntity } from "./entity/notification.entity";
import { OwnershipVerificationEntity } from "./entity/ownership-verification.entity";
import { QuoteRequestEntity } from "./entity/quote-request.entity";
import { SavedVehicleEntity } from "./entity/saved-vehicle.entity";
import { SellerProfileEntity } from "./entity/seller-profile.entity";
import { UserConsentEntity } from "./entity/user-consent.entity";
import { UserRoleEntity } from "./entity/user-role.entity";
import { UserEntity } from "./entity/user.entity";
import { VehicleRequestEntity } from "./entity/vehicle-request.entity";
import { VehicleDocumentEntity } from "./entity/vehicle-document.entity";
import { VehicleImageEntity } from "./entity/vehicle-image.entity";
import { VehiclePricingEntity } from "./entity/vehicle-pricing.entity";
import { VehicleSpecsEntity } from "./entity/vehicle-specs.entity";
import { VehicleStatusHistoryEntity } from "./entity/vehicle-status-history.entity";
import { VehicleEntity } from "./entity/vehicle.entity";
import { ViewingAppointmentEntity } from "./entity/viewing-appointment.entity";
import { ViewingParticipantEntity } from "./entity/viewing-participant.entity";
import { AuditLogRepository } from "./repository/audit-log.repository";
import { AdminActionLogRepository } from "./repository/admin-action-log.repository";
import { ApprovedViewingLocationRepository } from "./repository/approved-viewing-location.repository";
import { BuyerProfileRepository } from "./repository/buyer-profile.repository";
import { InspectionFindingRepository } from "./repository/inspection-finding.repository";
import { InspectionReportRepository } from "./repository/inspection-report.repository";
import { InspectionTaskRepository } from "./repository/inspection-task.repository";
import { NotificationAttemptRepository } from "./repository/notification-attempt.repository";
import { NotificationRepository } from "./repository/notification.repository";
import { OwnershipVerificationRepository } from "./repository/ownership-verification.repository";
import { QuoteRequestRepository } from "./repository/quote-request.repository";
import { SavedVehicleRepository } from "./repository/saved-vehicle.repository";
import { SellerProfileRepository } from "./repository/seller-profile.repository";
import { UserConsentRepository } from "./repository/user-consent.repository";
import { UserRoleRepository } from "./repository/user-role.repository";
import { UserRepository } from "./repository/user.repository";
import { VehicleRequestRepository } from "./repository/vehicle-request.repository";
import { VehicleDocumentRepository } from "./repository/vehicle-document.repository";
import { VehicleImageRepository } from "./repository/vehicle-image.repository";
import { VehiclePricingRepository } from "./repository/vehicle-pricing.repository";
import { VehicleSpecsRepository } from "./repository/vehicle-specs.repository";
import { VehicleStatusHistoryRepository } from "./repository/vehicle-status-history.repository";
import { VehicleRepository } from "./repository/vehicle.repository";
import { ViewingAppointmentRepository } from "./repository/viewing-appointment.repository";
import { ViewingParticipantRepository } from "./repository/viewing-participant.repository";

const ENTITIES = [
  UserEntity,
  UserRoleEntity,
  UserConsentEntity,
  BuyerProfileEntity,
  SellerProfileEntity,
  AuditLogEntity,
  AdminActionLogEntity,
  ApprovedViewingLocationEntity,
  SavedVehicleEntity,
  QuoteRequestEntity,
  VehicleRequestEntity,
  NotificationEntity,
  NotificationAttemptEntity,
  VehicleEntity,
  VehicleSpecsEntity,
  VehiclePricingEntity,
  VehicleImageEntity,
  VehicleDocumentEntity,
  VehicleStatusHistoryEntity,
  ViewingAppointmentEntity,
  ViewingParticipantEntity,
  OwnershipVerificationEntity,
  InspectionTaskEntity,
  InspectionReportEntity,
  InspectionFindingEntity,
];

const REPOSITORIES = [
  UserRepository,
  UserRoleRepository,
  UserConsentRepository,
  BuyerProfileRepository,
  SellerProfileRepository,
  AuditLogRepository,
  AdminActionLogRepository,
  ApprovedViewingLocationRepository,
  SavedVehicleRepository,
  QuoteRequestRepository,
  VehicleRequestRepository,
  NotificationRepository,
  NotificationAttemptRepository,
  VehicleRepository,
  VehicleSpecsRepository,
  VehiclePricingRepository,
  VehicleImageRepository,
  VehicleDocumentRepository,
  VehicleStatusHistoryRepository,
  ViewingAppointmentRepository,
  ViewingParticipantRepository,
  OwnershipVerificationRepository,
  InspectionTaskRepository,
  InspectionReportRepository,
  InspectionFindingRepository,
];

@Module({
  imports: [TypeOrmModule.forFeature(ENTITIES)],
  providers: REPOSITORIES,
  exports: [TypeOrmModule, ...REPOSITORIES],
})
export class DbModule {}
