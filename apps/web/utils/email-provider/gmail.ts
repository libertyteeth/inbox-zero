import type {
  Email,
  EmailProvider,
  Thread,
} from "@/utils/email-provider/types";
import {
  getAccessTokenFromClient,
  getGmailClientWithRefresh,
} from "@/utils/gmail/client";
import {
  getMessages as getGmailMessages,
  getMessagesBatch,
} from "@/utils/gmail/message";
import {
  getThreadsWithNextPageToken,
  getThreadsBatch,
} from "@/utils/gmail/thread";
import { getMessage as getGmailMessage } from "@/utils/gmail/message";
import { getThread as getGmailThread } from "@/utils/gmail/thread";
import { parseMessage } from "@/utils/mail";
import type {
  MessageWithPayload,
  ParsedMessage,
  ThreadWithPayloadMessages,
} from "@/utils/types";
import type { gmail_v1 } from "@googleapis/gmail";
import { isDefined } from "@/utils/types";

export class GmailProvider implements EmailProvider {
  private gmail: gmail_v1.Gmail;

  private constructor(gmail: gmail_v1.Gmail) {
    this.gmail = gmail;
  }

  static async create(
    emailAccountId: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: number,
  ): Promise<GmailProvider> {
    const gmail = await getGmailClientWithRefresh({
      emailAccountId,
      accessToken,
      refreshToken,
      expiresAt,
    });
    return new GmailProvider(gmail);
  }

  async getThreads(options: {
    query?: string;
    labelIds?: string[];
    maxResults?: number;
    pageToken?: string;
  }): Promise<{
    threads: Thread[];
    nextPageToken?: string;
  }> {
    const { threads: gmailThreads, nextPageToken } =
      await getThreadsWithNextPageToken({
        gmail: this.gmail,
        q: options.query,
        labelIds: options.labelIds,
        maxResults: options.maxResults,
        pageToken: options.pageToken,
      });

    if (!gmailThreads || gmailThreads.length === 0) {
      return { threads: [], nextPageToken: nextPageToken || undefined };
    }

    const threadIds = gmailThreads.map((t) => t.id).filter(isDefined);
    const accessToken = getAccessTokenFromClient(this.gmail);
    const threadsWithPayload = await getThreadsBatch(threadIds, accessToken);

    return {
      threads: threadsWithPayload.map(this.transformThread),
      nextPageToken: nextPageToken || undefined,
    };
  }

  async getThread(threadId: string): Promise<Thread | null> {
    const thread = await getGmailThread(threadId, this.gmail);
    if (!thread) return null;

    return this.transformThread(thread);
  }

  async getMessages(options: {
    query?: string;
    maxResults?: number;
    pageToken?: string;
    labelIds?: string[];
  }): Promise<{
    messages: Email[];
    nextPageToken?: string;
  }> {
    const { messages: gmailMessages, nextPageToken } = await getGmailMessages(
      this.gmail,
      options,
    );

    if (!gmailMessages || gmailMessages.length === 0) {
      return { messages: [], nextPageToken: nextPageToken || undefined };
    }

    const messageIds = gmailMessages.map((m) => m.id).filter(isDefined);
    const accessToken = getAccessTokenFromClient(this.gmail);
    const messagesWithPayload = await getMessagesBatch({
      messageIds,
      accessToken,
    });

    return {
      messages: messagesWithPayload.map(this.transformMessage),
      nextPageToken: nextPageToken || undefined,
    };
  }

  async getMessage(messageId: string): Promise<Email | null> {
    const message = await getGmailMessage(messageId, this.gmail);
    if (!message) return null;

    return this.transformMessage(message as any);
  }

  private transformMessage(message: MessageWithPayload | ParsedMessage): Email {
    const parsedMessage =
      "headers" in message ? message : parseMessage(message);

    return {
      id: parsedMessage.id,
      threadId: parsedMessage.threadId,
      snippet: parsedMessage.snippet,
      historyId: parsedMessage.historyId,
      labelIds: parsedMessage.labelIds,
      payload: {
        headers: parsedMessage.headers,
        parts: parsedMessage.parts as any,
      },
    };
  }

  private transformThread(thread: ThreadWithPayloadMessages): Thread {
    return {
      id: thread.id!,
      historyId: thread.historyId!,
      messages: thread.messages!.map((m) =>
        this.transformMessage(m as MessageWithPayload),
      ),
      snippet: thread.snippet!,
    };
  }
}
