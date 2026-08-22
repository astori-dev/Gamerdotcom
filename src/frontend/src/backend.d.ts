import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
import type { ExternalBlob } from "@caffeineai/object-storage";
export type { ExternalBlob } from "@caffeineai/object-storage";
export type CommunityId = bigint;
export interface CommunitySummary {
    id: CommunityId;
    coverImageHash?: ExternalBlob;
    name: string;
    description: string;
    groupCount: bigint;
}
export type Time = bigint;
export interface PaginatedGroups {
    hasMore: boolean;
    groups: Array<GroupSummary>;
    nextCursor?: bigint;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface Group {
    id: GroupId;
    creator: Principal;
    coverImageHash?: ExternalBlob;
    communityId: CommunityId;
    name: string;
    createdAt: Time;
    description: string;
}
export interface Community {
    id: CommunityId;
    creator: Principal;
    coverImageHash?: ExternalBlob;
    name: string;
    createdAt: Time;
    description: string;
}
export type GroupId = bigint;
export interface GroupSummary {
    id: GroupId;
    coverImageHash?: ExternalBlob;
    communityId: CommunityId;
    name: string;
    memberCount: bigint;
    description: string;
}
export interface Cell {
    value: Value;
    name: string;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export interface PostResponse {
    id: bigint;
    postType: PostType;
    authorUsername: string;
    likeCount: bigint;
    isRepostedByCurrentUser: boolean;
    authorProfilePictureHash?: ExternalBlob;
    repostCount: bigint;
    createdAt: Time;
    text: string;
    author: Principal;
    mediaHash?: ExternalBlob;
    replyCount: bigint;
    mediaType?: string;
    editedAt?: Time;
    authorDisplayName: string;
    isLikedByCurrentUser: boolean;
}
export interface PaginatedFollows {
    nextOffset?: bigint;
    hasMore: boolean;
    users: Array<FollowUserResponse>;
}
export interface TrendingHashtag {
    tag: string;
    count: bigint;
}
export interface GroupMember {
    principal: Principal;
    joinedAt: Time;
}
export type PostType = {
    __kind__: "repost";
    repost: bigint;
} | {
    __kind__: "quote";
    quote: bigint;
} | {
    __kind__: "original";
    original: null;
} | {
    __kind__: "reply";
    reply: bigint;
};
export interface PaginatedPosts {
    hasMore: boolean;
    posts: Array<PostResponse>;
    nextCursor?: bigint;
}
export interface PaginatedGroupPosts {
    hasMore: boolean;
    posts: Array<GroupPost>;
    nextCursor?: bigint;
}
export interface PaginatedNotifications {
    hasMore: boolean;
    notifications: Array<Notification>;
    nextCursor?: bigint;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface UserProfileResponse {
    bio: string;
    isBlockedByCurrentUser: boolean;
    principal: Principal;
    username: string;
    displayName: string;
    isMutedByCurrentUser: boolean;
    followersCount: bigint;
    createdAt: Time;
    updatedAt: Time;
    headerImageHash?: ExternalBlob;
    followingCount: bigint;
    isFollowedByCurrentUser: boolean;
    profilePictureHash?: ExternalBlob;
    postsCount: bigint;
}
export type NotificationType = {
    __kind__: "repost";
    repost: bigint;
} | {
    __kind__: "like";
    like: bigint;
} | {
    __kind__: "quote";
    quote: bigint;
} | {
    __kind__: "mention";
    mention: bigint;
} | {
    __kind__: "reply";
    reply: bigint;
} | {
    __kind__: "follow";
    follow: null;
};
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export interface FollowUserResponse {
    principal: Principal;
    username: string;
    displayName: string;
    profilePictureHash?: ExternalBlob;
}
export interface Notification {
    id: bigint;
    notificationType: NotificationType;
    createdAt: Time;
    isRead: boolean;
    actorUsername: string;
    actorPrincipal: Principal;
}
export interface GroupPost {
    id: bigint;
    createdAt: Time;
    text: string;
    author: Principal;
    groupId: GroupId;
    mediaHash?: ExternalBlob;
    mediaType?: string;
}
export interface UserProfile {
    bio: string;
    username: string;
    displayName: string;
    createdAt: Time;
    updatedAt: Time;
    headerImageHash?: ExternalBlob;
    profilePictureHash?: ExternalBlob;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    blockUser(user: Principal): Promise<void>;
    checkUsernameAvailability(username: string): Promise<boolean>;
    createCommunity(name: string, description: string, coverImageHash: ExternalBlob | null): Promise<Community>;
    createGroup(communityId: CommunityId, name: string, description: string, coverImageHash: ExternalBlob | null): Promise<Group>;
    createGroupPost(groupId: GroupId, text: string, mediaHash: ExternalBlob | null, mediaType: string | null): Promise<GroupPost>;
    createPost(text: string, mediaHash: ExternalBlob | null, mediaType: string | null): Promise<PostResponse>;
    createReply(parentPostId: bigint, text: string, mediaHash: ExternalBlob | null, mediaType: string | null): Promise<PostResponse>;
    deletePost(postId: bigint): Promise<void>;
    editPost(postId: bigint, text: string): Promise<PostResponse>;
    execute(qJson: string): Promise<Result>;
    followUser(user: Principal): Promise<void>;
    getCallerUserRole(): Promise<UserRole>;
    getCommunity(id: CommunityId): Promise<Community | null>;
    getFollowers(username: string, offset: bigint, limit: bigint): Promise<PaginatedFollows>;
    getFollowing(username: string, offset: bigint, limit: bigint): Promise<PaginatedFollows>;
    getGlobalFeed(cursor: bigint | null, limit: bigint): Promise<PaginatedPosts>;
    getGroup(id: GroupId): Promise<Group | null>;
    getGroupFeed(groupId: GroupId, cursor: bigint | null, limit: bigint): Promise<PaginatedGroupPosts>;
    getGroupMembers(groupId: GroupId, offset: bigint, limit: bigint): Promise<Array<GroupMember>>;
    getGroupPost(postId: bigint): Promise<GroupPost | null>;
    getHomeFeed(cursor: bigint | null, limit: bigint): Promise<PaginatedPosts>;
    getNotifications(cursor: bigint | null, limit: bigint): Promise<PaginatedNotifications>;
    getPost(postId: bigint): Promise<PostResponse | null>;
    getPostsByHashtag(tag: string, cursor: bigint | null, limit: bigint): Promise<PaginatedPosts>;
    getPostsByUser(user: Principal, cursor: bigint | null, limit: bigint): Promise<PaginatedPosts>;
    getPostsByUsername(username: string, cursor: bigint | null, limit: bigint): Promise<PaginatedPosts>;
    getPrincipalByUsername(username: string): Promise<Principal | null>;
    getProfile(): Promise<UserProfile | null>;
    getProfileByUsername(username: string): Promise<UserProfileResponse | null>;
    getReplies(postId: bigint, cursor: bigint | null, limit: bigint): Promise<PaginatedPosts>;
    getTrendingHashtags(limit: bigint): Promise<Array<TrendingHashtag>>;
    getUnreadNotificationCount(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfileResponse | null>;
    isCallerAdmin(): Promise<boolean>;
    isGroupMember(groupId: GroupId, member: Principal): Promise<boolean>;
    joinGroup(groupId: GroupId): Promise<void>;
    leaveGroup(groupId: GroupId): Promise<void>;
    likePost(postId: bigint): Promise<void>;
    listCommunities(cursor: bigint | null, limit: bigint): Promise<Array<CommunitySummary>>;
    listGroupsByCommunity(communityId: CommunityId, cursor: bigint | null, limit: bigint): Promise<PaginatedGroups>;
    markAllNotificationsRead(): Promise<void>;
    markNotificationRead(notifId: bigint): Promise<void>;
    muteUser(user: Principal): Promise<void>;
    quotePost(postId: bigint, text: string, mediaHash: ExternalBlob | null, mediaType: string | null): Promise<PostResponse>;
    repostPost(postId: bigint): Promise<PostResponse>;
    schema(): Promise<string>;
    searchCommunities(searchText: string, limit: bigint): Promise<Array<CommunitySummary>>;
    searchGroups(searchText: string, limit: bigint): Promise<Array<GroupSummary>>;
    searchPosts(searchText: string, cursor: bigint | null, limit: bigint): Promise<PaginatedPosts>;
    searchUsers(searchText: string, limit: bigint): Promise<Array<UserProfileResponse>>;
    setProfile(username: string, displayName: string, bio: string): Promise<void>;
    unblockUser(user: Principal): Promise<void>;
    undoRepost(postId: bigint): Promise<void>;
    unfollowUser(user: Principal): Promise<void>;
    unlikePost(postId: bigint): Promise<void>;
    unmuteUser(user: Principal): Promise<void>;
    updateHeaderImage(imageHash: ExternalBlob | null): Promise<void>;
    updateProfilePicture(pictureHash: ExternalBlob | null): Promise<void>;
}
