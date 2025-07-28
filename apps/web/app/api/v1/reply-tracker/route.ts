import { NextResponse } from "next/server";
import { withError } from "@/utils/middleware";
import { createScopedLogger } from "@/utils/logger";
import {
  replyTrackerQuerySchema,
  type ReplyTrackerResponse,
} from "./validation";
import { validateApiKeyAndGetEmailProvider } from "@/utils/api-auth";
import { ThreadTrackerType } from "@prisma/client";
import { getPaginatedThreadTrackers } from "@/app/(app)/[emailAccountId]/reply-zero/fetch-trackers";
import { isDefined } from "@/utils/types";
import { getEmailAccountId } from "@/app/api/v1/helpers";
import { Email, type Thread } from "@/utils/email-provider/types";

const logger = createScopedLogger("api/v1/reply-tracker");

export const GET = withError(async (request) => {
  const { emailProvider, userId, accountId } =
    await validateApiKeyAndGetEmailProvider(request);

  const { searchParams } = new URL(request.url);
  const queryResult = replyTrackerQuerySchema.safeParse(
    Object.fromEntries(searchParams),
  );

  if (!queryResult.success) {
    return NextResponse.json(
      { error: "Invalid query parameters" },
      { status: 400 },
    );
  }

  const emailAccountId = await getEmailAccountId({
    email: queryResult.data.email,
    accountId,
    userId,
  });

  if (!emailAccountId) {
    return NextResponse.json(
      { error: "Email account not found" },
      { status: 400 },
    );
  }

  try {
    function getType(type: "needs-reply" | "needs-follow-up") {
      if (type === "needs-reply") return ThreadTrackerType.NEEDS_REPLY;
      if (type === "needs-follow-up") return ThreadTrackerType.AWAITING;
      throw new Error("Invalid type");
    }

    const { trackers, count } = await getPaginatedThreadTrackers({
      emailAccountId,
      type: getType(queryResult.data.type),
      page: queryResult.data.page,
      timeRange: queryResult.data.timeRange,
    });

    const threads = (
      await Promise.all(
        trackers.map((tracker) => emailProvider.getThread(tracker.threadId)),
      )
    ).filter((t): t is Thread => t !== null);

    const response: ReplyTrackerResponse = {
      emails: threads
        .map((thread) => {
          const lastMessage = thread.messages[thread.messages.length - 1];
          if (!lastMessage) return null;
          const subject =
            lastMessage.payload.headers.find((h) => h.name === "Subject")
              ?.value || "";
          const from =
            lastMessage.payload.headers.find((h) => h.name === "From")?.value ||
            "";
          const date =
            lastMessage.payload.headers.find((h) => h.name === "Date")?.value ||
            "";
          return {
            threadId: thread.id,
            subject,
            from,
            date,
            snippet: lastMessage.snippet,
          };
        })
        .filter(isDefined),
      count,
    };

    logger.info("Retrieved emails needing reply", {
      userId,
      count: response.emails.length,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error retrieving emails needing reply", {
      userId,
      error,
    });
    return NextResponse.json(
      { error: "Failed to retrieve emails" },
      { status: 500 },
    );
  }
});
