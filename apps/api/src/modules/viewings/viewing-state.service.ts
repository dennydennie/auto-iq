import { ConflictException, Injectable } from "@nestjs/common";
import type { ViewingStatus } from "../../common/constants/listing.constants";

@Injectable()
export class ViewingStateService {
  confirm(current: ViewingStatus) {
    return this.transition(
      current,
      ["REQUESTED", "PENDING_SELLER_CONFIRMATION", "RESCHEDULED"],
      "CONFIRMED",
    );
  }

  sellerAcknowledge(current: ViewingStatus) {
    return this.transition(
      current,
      ["REQUESTED"],
      "PENDING_SELLER_CONFIRMATION",
    );
  }

  reschedule(current: ViewingStatus) {
    return this.transition(
      current,
      ["CONFIRMED", "RESCHEDULED"],
      "RESCHEDULED",
    );
  }

  cancel(current: ViewingStatus) {
    return this.transition(
      current,
      ["REQUESTED", "PENDING_SELLER_CONFIRMATION", "CONFIRMED", "RESCHEDULED"],
      "CANCELLED",
    );
  }

  complete(current: ViewingStatus, outcome: "COMPLETED" | "NO_SHOW") {
    return this.transition(current, ["CONFIRMED", "RESCHEDULED"], outcome);
  }

  private transition(
    current: ViewingStatus,
    allowed: ViewingStatus[],
    next: ViewingStatus,
  ) {
    if (!allowed.includes(current)) {
      throw new ConflictException({
        code: "INVALID_STATE_TRANSITION",
        message: `Cannot move viewing from ${current} to ${next}`,
      });
    }
    return next;
  }
}
