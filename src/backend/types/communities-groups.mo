import Time "mo:core/Time";
import Map "mo:core/Map";
import Storage "mo:caffeineai-object-storage/Storage";

module {
  public type CommunityId = Nat;
  public type GroupId = Nat;

  public type Community = {
    id : CommunityId;
    name : Text;
    description : Text;
    coverImageHash : ?Storage.ExternalBlob;
    creator : Principal;
    createdAt : Time.Time;
  };

  public type Group = {
    id : GroupId;
    communityId : CommunityId;
    name : Text;
    description : Text;
    coverImageHash : ?Storage.ExternalBlob;
    creator : Principal;
    createdAt : Time.Time;
  };

  public type GroupMember = {
    principal : Principal;
    joinedAt : Time.Time;
  };

  public type GroupPost = {
    id : Nat;
    groupId : GroupId;
    author : Principal;
    text : Text;
    mediaHash : ?Storage.ExternalBlob;
    mediaType : ?Text;
    createdAt : Time.Time;
  };

  public type CommunitySummary = {
    id : CommunityId;
    name : Text;
    description : Text;
    coverImageHash : ?Storage.ExternalBlob;
    groupCount : Nat;
  };

  public type GroupSummary = {
    id : GroupId;
    communityId : CommunityId;
    name : Text;
    description : Text;
    coverImageHash : ?Storage.ExternalBlob;
    memberCount : Nat;
  };

  public type PaginatedGroups = {
    groups : [GroupSummary];
    nextCursor : ?Nat;
    hasMore : Bool;
  };

  public type PaginatedGroupPosts = {
    posts : [GroupPost];
    nextCursor : ?Nat;
    hasMore : Bool;
  };

  public type CommunitiesGroupsState = {
    communities : Map.Map<CommunityId, Community>;
    groups : Map.Map<GroupId, Group>;
    communityGroups : Map.Map<CommunityId, Map.Map<GroupId, Bool>>;
    groupMembers : Map.Map<GroupId, Map.Map<Principal, GroupMember>>;
    userGroupMemberships : Map.Map<Principal, Map.Map<GroupId, Bool>>;
    groupPosts : Map.Map<GroupId, Map.Map<Nat, Bool>>;
    groupPostsById : Map.Map<Nat, GroupPost>;
    var nextCommunityId : Nat;
    var nextGroupId : Nat;
    var nextGroupPostId : Nat;
  };
};
