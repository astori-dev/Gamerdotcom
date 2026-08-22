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
import { Link } from "@tanstack/react-router";
import {
  Camera,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ExternalBlob } from "../backend";
import { useMediaUpload } from "../hooks/useMediaUpload";
import {
  useCreateCommunity,
  useListCommunities,
  useSearchCommunities,
} from "../hooks/useQueries";
import type { CommunitySummary } from "../utils/types";

export function CommunitiesPage() {
  const [query, setQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    data: allCommunities,
    isLoading: isLoadingAll,
    isError: isAllError,
  } = useListCommunities();
  const { data: searchResults, isLoading: isLoadingSearch } =
    useSearchCommunities(query);

  const isSearching = query.trim().length > 0;
  const communities: CommunitySummary[] = isSearching
    ? (searchResults ?? [])
    : (allCommunities ?? []);
  const isLoading = isSearching ? isLoadingSearch : isLoadingAll;

  return (
    <div>
      {/* Header bar */}
      <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search communities..."
              className="pl-9"
              data-ocid="communities.search_input"
            />
          </div>
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            data-ocid="communities.create_button"
          >
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </div>
      </div>

      {/* Directory */}
      <div className="px-4 py-4">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">
            {isSearching ? "Search results" : "Communities"}
          </h3>
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : isAllError && !isSearching ? (
          <p className="py-8 text-center text-destructive">
            Failed to load communities.
          </p>
        ) : communities.length === 0 ? (
          <div
            className="flex flex-col items-center px-8 py-16 text-center"
            data-ocid="communities.empty_state"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-semibold">
              {isSearching ? "No communities found" : "No communities yet"}
            </p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              {isSearching
                ? "Try a different search term."
                : "Create the first community to get started."}
            </p>
            {!isSearching && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setIsCreateOpen(true)}
                data-ocid="communities.create_empty_button"
              >
                <Plus className="h-4 w-4" />
                Create community
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {communities.map((community, index) => {
              const coverUrl = community.coverImageHash
                ? community.coverImageHash.getDirectURL()
                : null;
              return (
                <Link
                  key={community.id.toString()}
                  to="/community/$id"
                  params={{ id: community.id.toString() }}
                  className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-colors hover:bg-card-hover"
                  data-ocid={`communities.card.${index}`}
                >
                  <AspectRatio ratio={16 / 9}>
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={`${community.name} cover`}
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
                        {community.name}
                      </h4>
                      <Badge variant="secondary" className="shrink-0">
                        <FolderOpen className="h-3 w-3" />
                        {community.groupCount.toString()}
                      </Badge>
                    </div>
                    {community.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {community.description}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <CreateCommunityDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </div>
  );
}

interface CreateCommunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateCommunityDialog({
  open,
  onOpenChange,
}: CreateCommunityDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { mutateAsync: createCommunity } = useCreateCommunity();

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

      await createCommunity({
        name: name.trim(),
        description: description.trim(),
        coverImageHash,
      });

      toast.success("Community created");
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create community",
      );
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
          <DialogTitle>Create community</DialogTitle>
          <DialogDescription>
            Start a new community for people to share and connect.
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
                data-ocid="communities.create_cover_button"
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
            <Label htmlFor="communityName">Name</Label>
            <Input
              id="communityName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Community name"
              maxLength={100}
              disabled={isSaving}
              data-ocid="communities.create_name_input"
            />
            <p className="text-right text-xs text-muted-foreground">
              {name.length}/100
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="communityDescription">Description</Label>
            <Textarea
              id="communityDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this community about?"
              maxLength={500}
              rows={3}
              disabled={isSaving}
              data-ocid="communities.create_description_input"
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
            data-ocid="communities.create_submit_button"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSaving ? "Creating..." : "Create community"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
