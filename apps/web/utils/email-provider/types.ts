export interface EmailProvider {
  getThreads(options: {
    query?: string;
    labelIds?: string[];
    maxResults?: number;
    pageToken?: string;
  }): Promise<{
    threads: Thread[];
    nextPageToken?: string;
  }>;

  getThread(threadId: string): Promise<Thread | null>;

  getMessages(options: {
    query?: string;
    maxResults?: number;
    pageToken?: string;
    labelIds?: string[];
  }): Promise<{
    messages: Email[];
    nextPageToken?: string;
  }>;

  getMessage(messageId: string): Promise<Email | null>;
}

export interface Thread {
  id: string;
  historyId: string;
  messages: Email[];
  snippet: string;
}

export interface Email {
  id: string;
  threadId: string;
  snippet: string;
  historyId: string;
  labelIds: string[];
  payload: EmailPayload;
}

export interface EmailPayload {
  headers: { name: string; value: string }[];
  parts: EmailPart[];
}

export interface EmailPart {
  partId: string;
  mimeType: string;
  filename: string;
  headers: { name: string; value: string }[];
  body: {
    size: number;
    data?: string;
    attachmentId?: string;
  };
}

export interface Attachment {
  attachmentId: string;
  filename: string;
  size: number;
}
