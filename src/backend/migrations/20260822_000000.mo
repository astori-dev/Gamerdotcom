import Map "mo:core/Map";
import Time "mo:core/Time";
import Storage "mo:caffeineai-object-storage/Storage";
import AccessControl "mo:caffeineai-authorization/access-control";

// Adds the Communities & Groups stable state to the actor. Old types are
// inlined from the preceding migration (20250101_000000_Init.mo) so this
// frozen chain entry stays self-contained.
module {
  type UserProfile = {
    username : Text;
    displayName : Text;
    bio : Text;
    profilePictureHash : ?Storage.ExternalBlob;
    headerImageHash : ?Storage.ExternalBlob;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  type PostType = {
    #original;
    #reply : Nat;
    #repost : Nat;
    #quote : Nat;
  };

  type Post = {
    id : Nat;
    author : Principal;
    text : Text;
    mediaHash : ?Storage.ExternalBlob;
    mediaType : ?Text;
    postType : PostType;
    createdAt : Time.Time;
    editedAt : ?Time.Time;
  };

  type PostResponse = {
    id : Nat;
    author : Principal;
    authorUsername : Text;
    authorDisplayName : Text;
    authorProfilePictureHash : ?Storage.ExternalBlob;
    text : Text;
    mediaHash : ?Storage.ExternalBlob;
    mediaType : ?Text;
    postType : PostType;
    createdAt : Time.Time;
    editedAt : ?Time.Time;
    likeCount : Nat;
    replyCount : Nat;
    repostCount : Nat;
    isLikedByCurrentUser : Bool;
    isRepostedByCurrentUser : Bool;
  };

  type PaginatedPosts = {
    posts : [PostResponse];
    nextCursor : ?Nat;
    hasMore : Bool;
  };

  type TrendingHashtag = {
    tag : Text;
    count : Nat;
  };

  type UserProfileResponse = {
    principal : Principal;
    username : Text;
    displayName : Text;
    bio : Text;
    profilePictureHash : ?Storage.ExternalBlob;
    headerImageHash : ?Storage.ExternalBlob;
    createdAt : Time.Time;
    updatedAt : Time.Time;
    followersCount : Nat;
    followingCount : Nat;
    postsCount : Nat;
    isFollowedByCurrentUser : Bool;
    isBlockedByCurrentUser : Bool;
    isMutedByCurrentUser : Bool;
  };

  type FollowUserResponse = {
    principal : Principal;
    username : Text;
    displayName : Text;
    profilePictureHash : ?Storage.ExternalBlob;
  };

  type PaginatedFollows = {
    users : [FollowUserResponse];
    nextOffset : ?Nat;
    hasMore : Bool;
  };

  type NotificationType = {
    #like : Nat;
    #reply : Nat;
    #mention : Nat;
    #follow;
    #repost : Nat;
    #quote : Nat;
  };

  type Notification = {
    id : Nat;
    notificationType : NotificationType;
    actorPrincipal : Principal;
    actorUsername : Text;
    createdAt : Time.Time;
    isRead : Bool;
  };

  type PaginatedNotifications = {
    notifications : [Notification];
    nextCursor : ?Nat;
    hasMore : Bool;
  };

  type Community = {
    id : Nat;
    name : Text;
    description : Text;
    coverImageHash : ?Storage.ExternalBlob;
    creator : Principal;
    createdAt : Time.Time;
  };

  type Group = {
    id : Nat;
    communityId : Nat;
    name : Text;
    description : Text;
    coverImageHash : ?Storage.ExternalBlob;
    creator : Principal;
    createdAt : Time.Time;
  };

  type GroupMember = {
    principal : Principal;
    joinedAt : Time.Time;
  };

  type GroupPost = {
    id : Nat;
    groupId : Nat;
    author : Principal;
    text : Text;
    mediaHash : ?Storage.ExternalBlob;
    mediaType : ?Text;
    createdAt : Time.Time;
  };

  type CommunitiesGroupsState = {
    communities : Map.Map<Nat, Community>;
    groups : Map.Map<Nat, Group>;
    communityGroups : Map.Map<Nat, Map.Map<Nat, Bool>>;
    groupMembers : Map.Map<Nat, Map.Map<Principal, GroupMember>>;
    userGroupMemberships : Map.Map<Principal, Map.Map<Nat, Bool>>;
    groupPosts : Map.Map<Nat, Map.Map<Nat, Bool>>;
    groupPostsById : Map.Map<Nat, GroupPost>;
    var nextCommunityId : Nat;
    var nextGroupId : Nat;
    var nextGroupPostId : Nat;
  };

  type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    userProfiles : Map.Map<Principal, UserProfile>;
    usernameToUser : Map.Map<Text, Principal>;
    posts : Map.Map<Nat, Post>;
    userPostCounts : Map.Map<Principal, Nat>;
    var nextPostId : Nat;
    following : Map.Map<Principal, Map.Map<Principal, Bool>>;
    followers : Map.Map<Principal, Map.Map<Principal, Bool>>;
    blocks : Map.Map<Principal, Map.Map<Principal, Bool>>;
    mutes : Map.Map<Principal, Map.Map<Principal, Bool>>;
    postLikes : Map.Map<Nat, Map.Map<Principal, Bool>>;
    postReplies : Map.Map<Nat, Map.Map<Nat, Bool>>;
    postReposts : Map.Map<Nat, Map.Map<Principal, Bool>>;
    repostIndex : Map.Map<Principal, Map.Map<Nat, Nat>>;
    hashtagIndex : Map.Map<Text, Map.Map<Nat, Bool>>;
    userNotifications : Map.Map<Principal, Map.Map<Nat, Notification>>;
    var nextNotificationId : Nat;
  };

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    userProfiles : Map.Map<Principal, UserProfile>;
    usernameToUser : Map.Map<Text, Principal>;
    posts : Map.Map<Nat, Post>;
    userPostCounts : Map.Map<Principal, Nat>;
    var nextPostId : Nat;
    following : Map.Map<Principal, Map.Map<Principal, Bool>>;
    followers : Map.Map<Principal, Map.Map<Principal, Bool>>;
    blocks : Map.Map<Principal, Map.Map<Principal, Bool>>;
    mutes : Map.Map<Principal, Map.Map<Principal, Bool>>;
    postLikes : Map.Map<Nat, Map.Map<Principal, Bool>>;
    postReplies : Map.Map<Nat, Map.Map<Nat, Bool>>;
    postReposts : Map.Map<Nat, Map.Map<Principal, Bool>>;
    repostIndex : Map.Map<Principal, Map.Map<Nat, Nat>>;
    hashtagIndex : Map.Map<Text, Map.Map<Nat, Bool>>;
    userNotifications : Map.Map<Principal, Map.Map<Nat, Notification>>;
    var nextNotificationId : Nat;
    communitiesGroupsState : CommunitiesGroupsState;
  };

  public func migration(old : OldActor) : NewActor {
    {
      accessControlState = old.accessControlState;
      userProfiles = old.userProfiles;
      usernameToUser = old.usernameToUser;
      posts = old.posts;
      userPostCounts = old.userPostCounts;
      var nextPostId = old.nextPostId;
      following = old.following;
      followers = old.followers;
      blocks = old.blocks;
      mutes = old.mutes;
      postLikes = old.postLikes;
      postReplies = old.postReplies;
      postReposts = old.postReposts;
      repostIndex = old.repostIndex;
      hashtagIndex = old.hashtagIndex;
      userNotifications = old.userNotifications;
      var nextNotificationId = old.nextNotificationId;
      communitiesGroupsState = {
        communities = Map.empty();
        groups = Map.empty();
        communityGroups = Map.empty();
        groupMembers = Map.empty();
        userGroupMemberships = Map.empty();
        groupPosts = Map.empty();
        groupPostsById = Map.empty();
        var nextCommunityId = 0;
        var nextGroupId = 0;
        var nextGroupPostId = 0;
      };
    };
  };
};
