-- CreateTable User
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "theme" TEXT NOT NULL DEFAULT 'auto',
    "preferences" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable Session
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable Workspace
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "settings" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable WorkspaceMember
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member'
);

-- CreateTable MindMap
CREATE TABLE "MindMap" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "summary" TEXT,
    "prompt" TEXT,
    "provider" TEXT,
    "complexity" TEXT,
    "layout" TEXT,
    "style" TEXT,
    "settings" TEXT,
    "workspaceId" TEXT NOT NULL,
    "embeddings" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable MapNode
CREATE TABLE "MapNode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mindMapId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "x" REAL NOT NULL DEFAULT 0,
    "y" REAL NOT NULL DEFAULT 0,
    "width" REAL NOT NULL DEFAULT 200,
    "height" REAL NOT NULL DEFAULT 100,
    "color" TEXT,
    "shape" TEXT NOT NULL DEFAULT 'rectangle',
    "style" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isCollapsed" BOOLEAN NOT NULL DEFAULT false,
    "embeddings" TEXT,
    "lockedBy" TEXT,
    "lockedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable NodeCitation
CREATE TABLE "NodeCitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "summary" TEXT,
    "author" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable GenerationJob
CREATE TABLE "GenerationJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mindMapId" TEXT,
    "nodeId" TEXT,
    "prompt" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "result" TEXT,
    "error" TEXT,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable ContentAttachment
CREATE TABLE "ContentAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "content" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable Template
CREATE TABLE "Template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable UserProviderKey
CREATE TABLE "UserProviderKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "label" TEXT,
    "encryptedKey" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "usage" TEXT,
    "lastUsedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable ContentSource
CREATE TABLE "ContentSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "rawPayload" TEXT NOT NULL,
    "processedContent" TEXT,
    "metadata" TEXT,
    "error" TEXT,
    "embeddings" TEXT,
    "citations" TEXT,
    "contentHash" TEXT,
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable ShareLink
CREATE TABLE "ShareLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mindMapId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "password" TEXT,
    "expiresAt" DATETIME,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable UserPresence
CREATE TABLE "UserPresence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mindMapId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "cursorX" REAL,
    "cursorY" REAL,
    "color" TEXT NOT NULL,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable MapTemplate
CREATE TABLE "MapTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "complexity" TEXT NOT NULL DEFAULT 'moderate',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable ActivityLog
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "mindMapId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable Notification
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Workspace_createdAt_idx" ON "Workspace"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_userId_workspaceId_key" ON "WorkspaceMember"("userId", "workspaceId");

-- CreateIndex
CREATE INDEX "WorkspaceMember_workspaceId_idx" ON "WorkspaceMember"("workspaceId");

-- CreateIndex
CREATE INDEX "MindMap_workspaceId_idx" ON "MindMap"("workspaceId");

-- CreateIndex
CREATE INDEX "MindMap_createdAt_idx" ON "MindMap"("createdAt");

-- CreateIndex
CREATE INDEX "MapNode_mindMapId_idx" ON "MapNode"("mindMapId");

-- CreateIndex
CREATE INDEX "MapNode_parentId_idx" ON "MapNode"("parentId");

-- CreateIndex
CREATE INDEX "MapNode_level_idx" ON "MapNode"("level");

-- CreateIndex
CREATE INDEX "MapNode_lockedBy_idx" ON "MapNode"("lockedBy");

-- CreateIndex
CREATE INDEX "NodeCitation_nodeId_idx" ON "NodeCitation"("nodeId");

-- CreateIndex
CREATE INDEX "GenerationJob_status_idx" ON "GenerationJob"("status");

-- CreateIndex
CREATE INDEX "GenerationJob_createdAt_idx" ON "GenerationJob"("createdAt");

-- CreateIndex
CREATE INDEX "GenerationJob_mindMapId_idx" ON "GenerationJob"("mindMapId");

-- CreateIndex
CREATE INDEX "GenerationJob_nodeId_idx" ON "GenerationJob"("nodeId");

-- CreateIndex
CREATE INDEX "ContentAttachment_nodeId_idx" ON "ContentAttachment"("nodeId");

-- CreateIndex
CREATE INDEX "Template_workspaceId_idx" ON "Template"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProviderKey_userId_provider_key" ON "UserProviderKey"("userId", "provider");

-- CreateIndex
CREATE INDEX "UserProviderKey_userId_idx" ON "UserProviderKey"("userId");

-- CreateIndex
CREATE INDEX "ContentSource_workspaceId_idx" ON "ContentSource"("workspaceId");

-- CreateIndex
CREATE INDEX "ContentSource_userId_idx" ON "ContentSource"("userId");

-- CreateIndex
CREATE INDEX "ContentSource_status_idx" ON "ContentSource"("status");

-- CreateIndex
CREATE INDEX "ContentSource_sourceType_idx" ON "ContentSource"("sourceType");

-- CreateIndex
CREATE INDEX "ContentSource_contentHash_idx" ON "ContentSource"("contentHash");

-- CreateIndex
CREATE INDEX "ContentSource_createdAt_idx" ON "ContentSource"("createdAt");

-- CreateIndex
CREATE INDEX "ShareLink_mindMapId_idx" ON "ShareLink"("mindMapId");

-- CreateIndex
CREATE INDEX "ShareLink_token_idx" ON "ShareLink"("token");

-- CreateIndex
CREATE INDEX "ShareLink_expiresAt_idx" ON "ShareLink"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserPresence_userId_mindMapId_key" ON "UserPresence"("userId", "mindMapId");

-- CreateIndex
CREATE INDEX "UserPresence_mindMapId_idx" ON "UserPresence"("mindMapId");

-- CreateIndex
CREATE INDEX "UserPresence_lastSeenAt_idx" ON "UserPresence"("lastSeenAt");

-- CreateIndex
CREATE INDEX "MapTemplate_category_idx" ON "MapTemplate"("category");

-- CreateIndex
CREATE INDEX "MapTemplate_language_idx" ON "MapTemplate"("language");

-- CreateIndex
CREATE INDEX "MapTemplate_isPublic_idx" ON "MapTemplate"("isPublic");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_workspaceId_idx" ON "ActivityLog"("workspaceId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");
