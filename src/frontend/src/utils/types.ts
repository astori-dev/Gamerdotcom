import type { Principal } from "@icp-sdk/core/principal";
import type { ExternalBlob } from "../backend";

export type PostType =
  | { original: null }
  | { reply: bigint }
  | { repost: bigint }
  | { quote: bigint };

export interface Post {
  id: bigint;
  author: Principal;
  authorUsername: string;
  authorDisplayName: string;
  authorProfilePictureHash?: ExternalBlob;
  text: string;
  mediaHash?: ExternalBlob;
  mediaType?: string;
  postType: PostType;
  createdAt: bigint;
  editedAt?: bigint;
  likeCount: bigint;
  replyCount: bigint;
  repostCount: bigint;
  isLikedByCurrentUser: boolean;
  isRepostedByCurrentUser: boolean;
}

export interface PaginatedPosts {
  posts: Post[];
  nextCursor?: bigint;
  hasMore: boolean;
}

export interface FollowUserResponse {
  principal: Principal;
  username: string;
  displayName: string;
  profilePictureHash?: ExternalBlob;
}

export interface PaginatedFollows {
  users: FollowUserResponse[];
  nextOffset?: bigint;
  hasMore: boolean;
}

export interface UserProfileResponse {
  principal: Principal;
  username: string;
  displayName: string;
  bio: string;
  profilePictureHash?: ExternalBlob;
  headerImageHash?: ExternalBlob;
  createdAt: bigint;
  updatedAt: bigint;
  followersCount: bigint;
  followingCount: bigint;
  postsCount: bigint;
  isFollowedByCurrentUser: boolean;
  isBlockedByCurrentUser: boolean;
  isMutedByCurrentUser: boolean;
}

export type CommunityId = bigint;
export type GroupId = bigint;

export interface Community {
  id: CommunityId;
  creator: Principal;
  coverImageHash?: ExternalBlob;
  name: string;
  createdAt: bigint;
  description: string;
}

export interface CommunitySummary {
  id: CommunityId;
  coverImageHash?: ExternalBlob;
  name: string;
  description: string;
  groupCount: bigint;
}

export interface Group {
  id: GroupId;
  creator: Principal;
  coverImageHash?: ExternalBlob;
  communityId: CommunityId;
  name: string;
  createdAt: bigint;
  description: string;
}

export interface GroupSummary {
  id: GroupId;
  coverImageHash?: ExternalBlob;
  communityId: CommunityId;
  name: string;
  memberCount: bigint;
  description: string;
}

export interface PaginatedGroups {
  groups: GroupSummary[];
  nextCursor?: bigint;
  hasMore: boolean;
}

export interface GroupMember {
  principal: Principal;
  joinedAt: bigint;
}

export interface GroupPost {
  id: bigint;
  createdAt: bigint;
  text: string;
  author: Principal;
  groupId: GroupId;
  mediaHash?: ExternalBlob;
  mediaType?: string;
}

export interface PaginatedGroupPosts {
  posts: GroupPost[];
  nextCursor?: bigint;
  hasMore: boolean;
}
