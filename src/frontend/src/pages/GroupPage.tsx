import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link, getRouteApi } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Paperclip, PenLine, Users, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ExternalBlob } from "../backend";
import { BackButton } from "../components/BackButton";
import { FeedSkeleton } from "../components/FeedSkeleton";
import { PostText } from "../components/PostText";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { useMediaUpload } from "../hooks/useMediaUpload";
import {
  useCreateGroupPost,
  useGetCommunity,
  useGetGroup,
  useGetGroupFeed,
  useGetGroupMembers,
  useIsGroupMember,
  useJoinGroup,
  useLeaveGroup,
  useUserProfile,
} from "../hooks/useQueries";
import { MAX_POST_LENGTH } from "../utils/constants";
import { fromNanoseconds, getInitials } from "../utils/formatting";
import type { GroupMember, GroupPost } from "../utils/types";

const groupRouteApi = getRouteApi("/group/$id");

function parseGroupId(raw: string): bigint | null {
  try {
    const value = BigInt(raw);
    return value >= 0n ? value : null;
  } catch {
    return null;
  }
}

function MemberRow({ member }: { member: GroupMember }) {
  const { data: profile } = useUserProfile(member.principal);
  const displayName = profile?.displayName ?? "Member";
  const username = profile?.username ?? "";
  const avatarUrl = profile?.profilePictureHash
    ? profile.profilePictureHash.getDirectURL()
    : null;
  const joinedDate = fromNanoseconds(member.joinedAt);

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <Link
        to="/$username"
        params={{ username }}
        className="shrink-0"
        onClick={(e) => {
          if (!username) e.preventDefault();
        }}
      >
        <Avatar className="h-10 w-10">
          {avatarUrl && (
            <AvatarImage
              src={avatarUrl}
              alt={displayName}
              className="object-cover"
            />
          )}
          <AvatarFallback className="text-xs">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          to="/$username"
          params={{ username }}
          className="block truncate text-sm font-semibold hover:underline"
          onClick={(e) => {
            if (!username) e.preventDefault();
          }}
        >
          {displayName}
        </Link>
        {username && (
          <p className="truncate text-sm text-muted-foreground">@{username}</p>
        )}
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">
        Joined {formatDistanceToNow(joinedDate, { addSuffix: true })}
      </span>
    </li>
  );
}

function GroupPostCard({ post }: { post: GroupPost }) {
  const { data: profile } = useUserProfile(post.author);
  const displayName = profile?.displayName ?? "Member";
  const username = profile?.username ?? "";
  const avatarUrl = profile?.profilePictureHash
    ? profile.profilePictureHash.getDirectURL()
    : null;
  const createdDate = fromNanoseconds(post.createdAt);
  const mediaUrl = post.mediaHash ? post.mediaHash.getDirectURL() : null;

  return (
    <article className="border-b px-4 py-3">
      <div className="flex items-start gap-3">
        <Link
          to="/$username"
          params={{ username }}
          className="shrink-0"
          onClick={(e) => {
            if (!username) e.preventDefault();
          }}
        >
          <Avatar className="h-10 w-10">
            {avatarUrl && (
              <AvatarImage
                src={avatarUrl}
                alt={displayName}
                className="object-cover"
              />
            )}
            <AvatarFallback className="text-xs">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 truncate text-sm">
            <Link
              to="/$username"
              params={{ username }}
              className="truncate font-semibold hover:underline"
              onClick={(e) => {
                if (!username) e.preventDefault();
              }}
            >
              {displayName}
            </Link>
            {username && (
              <Link
                to="/$username"
                params={{ username }}
                className="truncate text-muted-foreground hover:underline"
                onClick={(e) => {
                  if (!username) e.preventDefault();
                }}
              >
                @{username}
              </Link>
            )}
            <span className="shrink-0 text-muted-foreground">·</span>
            <span className="shrink-0 text-muted-foreground">
              {formatDistanceToNow(createdDate, { addSuffix: true })}
            </span>
          </div>
          {post.text && (
            <PostText
              text={post.text}
              className="mt-1 whitespace-pre-wrap break-words text-sm"
            />
          )}
          {mediaUrl &&
            (post.mediaType === "video" ? (
              // biome-ignore lint/a11y/useMediaCaption: media element
              <video
                src={mediaUrl}
                controls
                preload="metadata"
                className="mt-2 max-h-80 w-full rounded-xl border object-cover"
              />
            ) : (
              <img
                src={mediaUrl}
                alt="Group post attachment"
                loading="lazy"
                className="mt-2 max-h-80 w-full rounded-xl border object-cover"
              />
            ))}
        </div>
      </div>
    </article>
  );
}

function GroupCompose({ groupId }: { groupId: bigint }) {
  const [text, setText] = useState("");
  const { mutate: createGroupPost, isPending } = useCreateGroupPost();
  const {
    file,
    previewUrl,
    error: mediaError,
    mediaType,
    selectMedia,
    removeMedia,
    createBlob,
    MediaInput,
  } = useMediaUpload();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const charCount = text.length;
  const isOverLimit = charCount > MAX_POST_LENGTH;
  const isEmpty = text.trim().length === 0 && !file;
  const isSubmitting = isPending || uploadProgress !== null;

  const handleSubmit = async () => {
    if (isEmpty || isOverLimit) return;

    let mediaHash: ExternalBlob | null = null;
    if (file) {
      try {
        setUploadProgress(0);
        mediaHash = await createBlob((pct) => setUploadProgress(pct));
      } catch {
        toast.error("Failed to upload media");
        setUploadProgress(null);
        return;
      }
    }

    createGroupPost(
      { groupId, text: text.trim(), mediaHash, mediaType },
      {
        onSuccess: () => {
          setText("");
          removeMedia();
          setUploadProgress(null);
          toast.success("Posted to group");
        },
        onError: (error) => {
          setUploadProgress(null);
          toast.error(error.message || "Failed to post to group");
        },
      },
    );
  };

  return (
    <div className="border-b px-4 py-3">
      <Textarea
        placeholder="Share something with this group..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isSubmitting}
        className="min-h-[80px] resize-none rounded-none border-0 p-0 text-base shadow-none focus-visible:ring-0"
      />
      {previewUrl && (
        <div className="relative mt-2 max-w-xs">
          <AspectRatio ratio={16 / 9}>
            {mediaType === "video" ? (
              // biome-ignore lint/a11y/useMediaCaption: media element
              <video
                src={previewUrl}
                controls
                className="h-full w-full rounded-md object-cover"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Attachment preview"
                className="h-full w-full rounded-md object-cover"
              />
            )}
          </AspectRatio>
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-1 top-1 h-6 w-6 rounded-full"
            onClick={removeMedia}
            disabled={isSubmitting}
            aria-label="Remove media"
          >
            <X className="h-3 w-3" />
          </Button>
          {uploadProgress !== null && (
            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/50">
              <span className="text-sm font-medium text-white">
                {Math.round(uploadProgress)}%
              </span>
            </div>
          )}
        </div>
      )}
      {mediaError && (
        <p className="mt-1 text-sm text-destructive">{mediaError}</p>
      )}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={selectMedia}
            disabled={isSubmitting || !!file}
            aria-label="Add media"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <span
            className={cn(
              "text-sm",
              isOverLimit ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {charCount}/{MAX_POST_LENGTH}
          </span>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isEmpty || isOverLimit || isSubmitting}
          size="sm"
          data-ocid="group.compose.submit_button"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Posting..." : "Post"}
        </Button>
      </div>
      <MediaInput />
    </div>
  );
}

export function GroupPage() {
  const { id: rawId } = groupRouteApi.useParams();
  const groupId = parseGroupId(rawId);

  const { identity } = useInternetIdentity();
  const currentPrincipal = identity?.getPrincipal() ?? null;

  const {
    data: group,
    isLoading: isLoadingGroup,
    isError: isGroupError,
  } = useGetGroup(groupId);
  const { data: isMember, isLoading: isLoadingMembership } = useIsGroupMember(
    groupId,
    currentPrincipal,
  );
  const { data: membersData, isLoading: isLoadingMembers } =
    useGetGroupMembers(groupId);
  const {
    data: feedData,
    isLoading: isLoadingFeed,
    isError: isFeedError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useGetGroupFeed(groupId);
  const { data: community } = useGetCommunity(group?.communityId ?? null);

  const { mutate: joinGroup, isPending: isJoinPending } = useJoinGroup();
  const { mutate: leaveGroup, isPending: isLeavePending } = useLeaveGroup();

  const members = membersData ?? [];
  const posts = feedData?.pages.flatMap((page) => page.posts) ?? [];

  const sentinelRef = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  const handleJoin = () => {
    if (groupId === null) return;
    joinGroup(groupId, {
      onError: (error) => toast.error(error.message || "Failed to join group"),
    });
  };

  const handleLeave = () => {
    if (groupId === null) return;
    leaveGroup(groupId, {
      onError: (error) => toast.error(error.message || "Failed to leave group"),
    });
  };

  if (isLoadingGroup) {
    return (
      <div>
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/80 px-4 py-2 backdrop-blur-sm">
          <BackButton />
          <Skeleton className="h-4 w-24" />
        </div>
        <AspectRatio ratio={3 / 1}>
          <Skeleton className="h-full w-full rounded-none" />
        </AspectRatio>
        <div className="border-b px-4 py-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="mt-2 h-4 w-2/3" />
          <Skeleton className="mt-3 h-4 w-24" />
        </div>
        <FeedSkeleton />
      </div>
    );
  }

  if (isGroupError || !group || groupId === null) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">Failed to load group.</p>
        <BackButton variant="link" label="Go back" className="mt-2" />
      </div>
    );
  }

  const coverImageUrl = group.coverImageHash
    ? group.coverImageHash.getDirectURL()
    : null;
  const isMembershipPending = isJoinPending || isLeavePending;
  const canPost = isMember === true;

  return (
    <div>
      {/* Header bar */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/80 px-4 py-2 backdrop-blur-sm">
        <BackButton />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">
            {group.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {members.length} members
          </p>
        </div>
      </div>

      {/* Cover image */}
      <AspectRatio ratio={3 / 1}>
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={`${group.name} cover`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </AspectRatio>

      {/* Group header */}
      <div className="border-b px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold leading-tight">{group.name}</h2>
            {community && (
              <Link
                to="/community/$id"
                params={{ id: community.id.toString() }}
                className="mt-0.5 inline-block text-sm text-primary hover:underline"
              >
                {community.name}
              </Link>
            )}
          </div>
          {!isLoadingMembership && (
            <Button
              variant={isMember ? "outline" : "default"}
              size="sm"
              onClick={isMember ? handleLeave : handleJoin}
              disabled={isMembershipPending}
              data-ocid={isMember ? "group.leave_button" : "group.join_button"}
            >
              {isMembershipPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {isMember ? "Leave group" : "Join group"}
            </Button>
          )}
        </div>

        {group.description && (
          <PostText
            text={group.description}
            className="mt-3 text-sm whitespace-pre-wrap"
          />
        )}

        <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            {members.length.toLocaleString()} member
            {members.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Compose for members */}
      {canPost && <GroupCompose groupId={groupId} />}

      {/* Group feed */}
      {isLoadingFeed ? (
        <FeedSkeleton />
      ) : isFeedError ? (
        <p className="p-4 text-center text-destructive">
          Failed to load group posts.
        </p>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center px-8 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <PenLine className="h-8 w-8 text-primary" />
          </div>
          <p className="text-lg font-semibold">No posts yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {canPost
              ? "Be the first to share something with this group."
              : "Join this group to start posting."}
          </p>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <GroupPostCard key={post.id.toString()} post={post} />
          ))}
          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
      )}

      {/* Member list */}
      <div className="border-t">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Members</h3>
        </div>
        {isLoadingMembers ? (
          <div className="space-y-4 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: stable list
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : members.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No members yet.
          </p>
        ) : (
          <ul>
            {members.map((member) => (
              <MemberRow key={member.principal.toText()} member={member} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
