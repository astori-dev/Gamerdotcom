import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Link, getRouteApi } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  Camera,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  Plus,
  Users,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ExternalBlob } from "../backend";
import { BackButton } from "../components/BackButton";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { useMediaUpload } from "../hooks/useMediaUpload";
import {
  useCreateGroup,
  useGetCommunity,
  useListGroupsByCommunity,
} from "../hooks/useQueries";
import { fromNanoseconds } from "../utils/formatting";

const communityRouteApi = getRouteApi("/community/$id");

export function CommunityPage() {
  const { id } = communityRouteApi.useParams();
  const communityId = BigInt(id);

  const {
    data: community,
    isLoading: isLoadingCommunity,
    isError: isCommunityError,
  } = useGetCommunity(communityId);

  const {
    data: groupsData,
    isLoading: isLoadingGroups,
    isError: isGroupsError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useListGroupsByCommunity(communityId);

  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  const groups = groupsData?.pages.flatMap((page) => page.groups) ?? [];

  const sentinelRef = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  if (isLoadingCommunity) {
    return (
      <div>
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/80 px-4 py-2 backdrop-blur-sm">
          <BackButton />
          <Skeleton className="h-4 w-32" />
        </div>
        <AspectRatio ratio={3 / 1}>
          <Skeleton className="h-full w-full rounded-none" />
        </AspectRatio>
        <div className="border-b px-4 py-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="mt-3 h-4 w-2/3" />
        </div>
        <div className="space-y-3 p-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (isCommunityError) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">Failed to load community.</p>
        <BackButton variant="link" label="Go back" className="mt-2" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="flex flex-col items-center px-8 py-20 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Users className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">Community not found</h2>
        <p className="mt-1 text-muted-foreground">
          This community may have been removed.
        </p>
        <BackButton variant="link" label="Go back" className="mt-4" />
      </div>
    );
  }

  const coverImageUrl = community.coverImageHash
    ? community.coverImageHash.getDirectURL()
    : null;
  const createdDate = fromNanoseconds(community.createdAt);

  return (
    <div>
      {/* Header bar */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/80 px-4 py-2 backdrop-blur-sm">
        <BackButton />
        <div>
          <p className="text-sm font-semibold leading-tight">
            {community.name}
          </p>
          <p className="text-xs text-muted-foreground">Community</p>
        </div>
      </div>

      {/* Cover banner */}
      <AspectRatio ratio={3 / 1}>
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={`${community.name} cover`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
      </AspectRatio>

      {/* Community header */}
      <div className="border-b px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold leading-tight">
              {community.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Created {format(createdDate, "MMM yyyy")}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsCreateGroupOpen(true)}
            data-ocid="community.create_group_button"
          >
            <Plus className="h-4 w-4" />
            Create group
          </Button>
        </div>

        {community.description && (
          <p className="mt-3 text-sm whitespace-pre-wrap">
            {community.description}
          </p>
        )}
      </div>

      {/* Groups section */}
      <div className="px-4 py-4">
        <div className="mb-3 flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Groups</h3>
        </div>

        {isLoadingGroups ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : isGroupsError ? (
          <p className="py-8 text-center text-destructive">
            Failed to load groups.
          </p>
        ) : groups.length === 0 ? (
          <div
            className="flex flex-col items-center px-8 py-16 text-center"
            data-ocid="community.groups_empty_state"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <FolderOpen className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-semibold">No groups yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Be the first to create a group in this community.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setIsCreateGroupOpen(true)}
              data-ocid="community.create_group_empty_button"
            >
              <Plus className="h-4 w-4" />
              Create group
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {groups.map((group, index) => {
                const groupCoverUrl = group.coverImageHash
                  ? group.coverImageHash.getDirectURL()
                  : null;
                return (
                  <Link
                    key={group.id.toString()}
                    to="/group/$id"
                    params={{ id: group.id.toString() }}
                    className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-colors hover:bg-card-hover"
                    data-ocid={`community.group_card.${index}`}
                  >
                    <AspectRatio ratio={16 / 9}>
                      {groupCoverUrl ? (
                        <img
                          src={groupCoverUrl}
                          alt={`${group.name} cover`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                      )}
                    </AspectRatio>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold leading-tight">
                          {group.name}
                        </h4>
                        <Badge variant="secondary" className="shrink-0">
                          <Users className="h-3 w-3" />
                          {group.memberCount.toString()}
                        </Badge>
                      </div>
                      {group.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {group.description}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
            <div ref={sentinelRef} className="h-1" />
            {isFetchingNextPage && (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </>
        )}
      </div>

      <CreateGroupDialog
        open={isCreateGroupOpen}
        onOpenChange={setIsCreateGroupOpen}
        communityId={communityId}
      />
    </div>
  );
}

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: bigint;
}

function CreateGroupDialog({
  open,
  onOpenChange,
  communityId,
}: CreateGroupDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { mutateAsync: createGroup } = useCreateGroup();

  const {
    file: coverFile,
    previewUrl: coverPreviewUrl,
    selectMedia: selectCoverImage,
    removeMedia: removeCoverImage,
    createBlob: createCoverBlob,
    MediaInput: CoverImageInput,
  } = useMediaUpload("image");

  // Reset form state when dialog opens
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setError("");
      removeCoverImage();
    }
  }, [open]);

  const canSubmit =
    name.trim().length > 0 &&
    name.length <= 100 &&
    description.length <= 500 &&
    !isSaving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setIsSaving(true);

    try {
      let coverImageHash: ExternalBlob | null = null;
      if (coverFile) {
        const blob = await createCoverBlob();
        if (blob) {
          coverImageHash = blob;
        }
      }

      await createGroup({
        communityId,
        name: name.trim(),
        description: description.trim(),
        coverImageHash,
      });

      toast.success("Group created");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (isSaving) return;
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create group</DialogTitle>
          <DialogDescription>
            Start a new group inside this community.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cover image */}
          <div>
            <Label>Cover image</Label>
            <div className="relative mt-1 overflow-hidden rounded-lg">
              <AspectRatio ratio={16 / 9}>
                {coverPreviewUrl ? (
                  <img
                    src={coverPreviewUrl}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                )}
              </AspectRatio>
              <button
                type="button"
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100"
                onClick={selectCoverImage}
                disabled={isSaving}
                aria-label="Add cover image"
                data-ocid="community.create_group_cover_button"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
              <CoverImageInput />
            </div>
            {coverPreviewUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1"
                onClick={removeCoverImage}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
                Remove image
              </Button>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="groupName">Name</Label>
            <Input
              id="groupName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Group name"
              maxLength={100}
              disabled={isSaving}
              data-ocid="community.create_group_name_input"
            />
            <p className="text-right text-xs text-muted-foreground">
              {name.length}/100
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="groupDescription">Description</Label>
            <Textarea
              id="groupDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
              maxLength={500}
              rows={3}
              disabled={isSaving}
              data-ocid="community.create_group_description_input"
            />
            <p className="text-right text-xs text-muted-foreground">
              {description.length}/500
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            className="w-full"
            disabled={!canSubmit}
            data-ocid="community.create_group_submit_button"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSaving ? "Creating..." : "Create group"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
