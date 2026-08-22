import Storage "mo:caffeineai-object-storage/Storage";
import Types "../types/communities-groups";
import CommunitiesGroupsLib "../lib/communities-groups";

mixin (state : Types.CommunitiesGroupsState) {
  public shared ({ caller }) func createCommunity(
    name : Text,
    description : Text,
    coverImageHash : ?Storage.ExternalBlob,
  ) : async Types.Community {
    CommunitiesGroupsLib.createCommunity(state, caller, name, description, coverImageHash);
  };

  public query func getCommunity(id : Types.CommunityId) : async ?Types.Community {
    CommunitiesGroupsLib.getCommunity(state, id);
  };

  public query func listCommunities(cursor : ?Nat, limit : Nat) : async [Types.CommunitySummary] {
    CommunitiesGroupsLib.listCommunities(state, cursor, limit);
  };

  public query func searchCommunities(searchText : Text, limit : Nat) : async [Types.CommunitySummary] {
    CommunitiesGroupsLib.searchCommunities(state, searchText, limit);
  };

  public shared ({ caller }) func createGroup(
    communityId : Types.CommunityId,
    name : Text,
    description : Text,
    coverImageHash : ?Storage.ExternalBlob,
  ) : async Types.Group {
    CommunitiesGroupsLib.createGroup(state, communityId, caller, name, description, coverImageHash);
  };

  public query func getGroup(id : Types.GroupId) : async ?Types.Group {
    CommunitiesGroupsLib.getGroup(state, id);
  };

  public query func listGroupsByCommunity(communityId : Types.CommunityId, cursor : ?Nat, limit : Nat) : async Types.PaginatedGroups {
    CommunitiesGroupsLib.listGroupsByCommunity(state, communityId, cursor, limit);
  };

  public query func searchGroups(searchText : Text, limit : Nat) : async [Types.GroupSummary] {
    CommunitiesGroupsLib.searchGroups(state, searchText, limit);
  };

  public shared ({ caller }) func joinGroup(groupId : Types.GroupId) : async () {
    CommunitiesGroupsLib.joinGroup(state, groupId, caller);
  };

  public shared ({ caller }) func leaveGroup(groupId : Types.GroupId) : async () {
    CommunitiesGroupsLib.leaveGroup(state, groupId, caller);
  };

  public query func getGroupMembers(groupId : Types.GroupId, offset : Nat, limit : Nat) : async [Types.GroupMember] {
    CommunitiesGroupsLib.getGroupMembers(state, groupId, offset, limit);
  };

  public query func isGroupMember(groupId : Types.GroupId, member : Principal) : async Bool {
    CommunitiesGroupsLib.isGroupMember(state, groupId, member);
  };

  public shared ({ caller }) func createGroupPost(
    groupId : Types.GroupId,
    text : Text,
    mediaHash : ?Storage.ExternalBlob,
    mediaType : ?Text,
  ) : async Types.GroupPost {
    CommunitiesGroupsLib.createGroupPost(state, groupId, caller, text, mediaHash, mediaType);
  };

  public query func getGroupFeed(groupId : Types.GroupId, cursor : ?Nat, limit : Nat) : async Types.PaginatedGroupPosts {
    CommunitiesGroupsLib.getGroupFeed(state, groupId, cursor, limit);
  };

  public query func getGroupPost(postId : Nat) : async ?Types.GroupPost {
    CommunitiesGroupsLib.getGroupPost(state, postId);
  };
};
