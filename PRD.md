# Product Requirements Document: IMAP Integration

## 1. Overview

This document outlines the requirements for adding IMAP (Internet Message Access Protocol) support to the application. This feature will focus on self-hosted IMAP setups, providing a complete privacy-oriented solution. The goal is to create a powerful, open-source tool that empowers users to manage their email with a focus on privacy and control.

## 2. Guiding Principles

*   **Privacy First:** All decisions will be made with user privacy as the top priority. We will collect the minimum amount of data necessary and be transparent about what we collect.
*   **Open Source:** The project will be open source, allowing for community contributions and transparency.
*   **Self-Hosted Focus:** The primary target for this feature is users with their own self-hosted email servers.
*   **Seamless Integration:** The IMAP functionality should be seamlessly integrated into the existing user interface and business logic, providing a consistent and intuitive user experience.

## 3. Goals

*   Allow users to connect their self-hosted IMAP accounts securely.
*   Fetch, read, and display emails from IMAP accounts in a secure and private manner.
*   Provide a robust and reliable connection to IMAP servers.
*   Abstract the email provider logic to easily support both Gmail and IMAP.

## 4. User Stories

*   As a user with a self-hosted email server, I want to be able to connect my email account by providing my email address, password, and IMAP/SMTP server details.
*   As a user, I want to be able to use XOAUTH2 for authentication if my server supports it, for enhanced security.
*   As a user, I want to be confident that my credentials and email data are stored securely and privately.
*   As a user, I want to see all my emails from my IMAP account in the application, just like my Gmail emails.
*   As a user, I want to be able to read and send emails from my IMAP account.

## 5. Technical Requirements

### 5.1. Backend

*   **Abstraction Layer:** An abstraction layer will be created to decouple the application logic from the specific email provider (Gmail, IMAP). This will involve creating a generic `EmailProvider` interface that both the existing Gmail client and the new IMAP client will implement.
*   **IMAP Library:** We will use the `imapflow` library to interact with IMAP servers. It is a modern, promise-based library that is well-maintained and has good documentation.
*   **Authentication:**
    *   **XOAUTH2:** The primary authentication method will be XOAUTH2. We will provide documentation and support for configuring XOAUTH2 with popular self-hosted email servers like Dovecot.
    *   **Password-based:** For servers that do not support XOAUTH2, we will provide a fallback to traditional username/password authentication. We will strongly recommend the use of app-specific passwords.
*   **Credential Security:** All credentials will be encrypted at rest in the database. We will research and implement a solution that prevents credential compromise even if the database is breached. This may involve using a Key Management Service (KMS) or asymmetric encryption.
*   **Email Fetching and Sending:** The `EmailProvider` interface will define methods for fetching, reading, and sending emails, which will be implemented by the IMAP client using `imapflow` and `nodemailer`.
*   **API Endpoints:** The existing API endpoints for email operations will be adapted to use the new abstraction layer, allowing them to work with both Gmail and IMAP accounts.

### 5.2. Frontend

*   **IMAP Account Connection:** The "Accounts" page will be updated to allow users to add a self-hosted IMAP account. The UI will be designed to seamlessly integrate with the existing flow.
*   **Consistent UX:** Emails from IMAP accounts will be displayed and managed in the same way as Gmail emails, ensuring a consistent user experience.

## 6. Implementation Plan

### Phase 1: Abstraction Layer and Gmail Refactoring

1.  **Backend:**
    1.  Design and implement the `EmailProvider` abstraction layer.
    2.  Refactor the existing Gmail client to implement the `EmailProvider` interface.
    3.  Adapt the API endpoints to use the `EmailProvider` abstraction layer.
    4.  Thoroughly test the application to ensure that all existing Gmail functionality works as expected with the new abstraction layer.
2.  **Frontend:**
    1.  No frontend changes will be made in this phase.

### Phase 2: IMAP Integration

1.  **Backend:**
    1.  Add `imapflow` and `nodemailer` to the `package.json` of the `apps/mcp-server` application.
    2.  Create a new module `apps/mcp-server/src/imap` to encapsulate all IMAP-related functionality.
    3.  Implement the IMAP client, including support for XOAUTH2 and password-based authentication, ensuring it conforms to the `EmailProvider` interface.
    4.  Update the database schema to include a new table for IMAP accounts, including securely encrypted credentials.
2.  **Frontend:**
    1.  Update the "Accounts" page to include a form for adding IMAP accounts.
    2.  Ensure that the UI for displaying and interacting with emails works seamlessly with both Gmail and IMAP accounts.

## 7. Security and Privacy

*   **XOAUTH2:** XOAUTH2 will be the preferred authentication method to avoid storing user passwords.
*   **Credential Encryption:** All stored credentials will be encrypted using a state-of-the-art method to protect against database breaches.
*   **Secure Communication:** All communication with IMAP/SMTP servers will be over a secure (TLS) connection.
*   **No Logging of Sensitive Data:** We will not log any sensitive user information, such as passwords or email content.
*   **Full Data Control:** The application will be designed to run entirely on a user's own infrastructure, ensuring they have full control over their data.

## 8. Risks and Mitigations

*   **Risk:** Supporting a wide variety of self-hosted IMAP server configurations can be challenging.
*   **Mitigation:** We will provide clear documentation and configuration examples for popular self-hosted email solutions like Dovecot. We will also foster a community forum where users can help each other with configuration issues.
*   **Risk:** Implementing a secure and robust credential storage system is complex.
*   **Mitigation:** We will dedicate significant effort to researching and implementing the best possible solution, potentially using a third-party security expert to review our design.
