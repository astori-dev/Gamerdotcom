import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Storage "mo:caffeineai-object-storage/Storage";
import Types "../types/communities-groups";

module {
  let maxGroupsPerCommunity : Nat = 100_000;
  let maxMembersPerGroup : Nat = 100_000;

  func textContains(haystack : Text, needle : Text) : Bool {
    haystack.toLower().contains(#text (needle.toLower()));
  };

  func communityGroupsOf(state : Types.CommunitiesGroupsState, communityId : Types.CommunityId) : Map.Map<Types.GroupId, Bool> {
    switch (state.communityGroups.get(communityId)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Types.GroupId, Bool>();
        state.communityGroups.add(communityId, m);
        m;
      };
    };
  };

  func membersOf(state : Types.CommunitiesGroupsState, groupId : Types.GroupId) : Map.Map<Principal, Types.GroupMember> {
    switch (state.groupMembers.get(groupId)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Principal, Types.GroupMember>();
        state.groupMembers.add(groupId, m);
        m;
      };
    };
  };

  func userMembershipsOf(state : Types.CommunitiesGroupsState, user : Principal) : Map.Map<Types.GroupId, Bool> {
    switch (state.userGroupMemberships.get(user)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Types.GroupId, Bool>();
        state.userGroupMemberships.add(user, m);
        m;
      };
    };
  };

  func groupPostsOf(state : Types.CommunitiesGroupsState, groupId : Types.GroupId) : Map.Map<Nat, Bool> {
    switch (state.groupPosts.get(groupId)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Nat, Bool>();
        state.groupPosts.add(groupId, m);
        m;
      };
    };
  };

  func toCommunitySummary(state : Types.CommunitiesGroupsState, c : Types.Community) : Types.CommunitySummary {
    let groupCount = switch (state.communityGroups.get(c.id)) {
      case (?m) { m.size() };
      case (null) { 0 };
    };
    {
      id = c.id;
      name = c.name;
      description = c.description;
      coverImageHash = c.coverImageHash;
      groupCount;
    };
  };

  func toGroupSummary(state : Types.CommunitiesGroupsState, g : Types.Group) : Types.GroupSummary {
    let memberCount = switch (state.groupMembers.get(g.id)) {
      case (?m) { m.size() };
      case (null) { 0 };
    };
    {
      id = g.id;
      communityId = g.communityId;
      name = g.name;
      description = g.description;
      coverImageHash = g.coverImageHash;
      memberCount;
    };
  };

  // Paginate a Map<Nat, V> by id descending with a cursor (last seen id).
  func paginateIds<V>(m : Map.Map<Nat, V>, cursor : ?Nat, limit : Nat) : ([Nat], ?Nat, Bool) {
    let ids = List.empty<Nat>();
    for ((id, _) in m.entries()) { ids.add(id) };
    ids.sortInPlace(
      func(a, b) {
        if (a > b) { #less } else if (a < b) { #greater } else { #equal };
      }
    );
    let result = List.empty<Nat>();
    var foundExtra = false;
    for (id in ids.values()) {
      let pastCursor = switch (cursor) {
        case (?c) { id < c };
        case (null) { true };
      };
      if (pastCursor and not foundExtra) {
        if (result.size() < limit) {
          result.add(id);
        } else {
          foundExtra := true;
        };
      };
    };
    let arr = result.toArray();
    let nextCursor = if (foundExtra and arr.size() > 0) { ?arr[arr.size() - 1] } else { null };
    (arr, nextCursor, foundExtra);
  };

  public func createCommunity(state : Types.CommunitiesGroupsState, creator : Principal, name : Text, description : Text, coverImageHash : ?Storage.ExternalBlob) : Types.Community {
    if (name == "") { Runtime.trap("Community name cannot be empty") };
    if (description == "") { Runtime.trap("Community description cannot be empty") };
    let id = state.nextCommunityId;
    state.nextCommunityId += 1;
    let community : Types.Community = {
      id;
      name;
      description;
      coverImageHash;
      creator;
      createdAt = Time.now();
    };
    state.communities.add(id, community);
    community;
  };

  public func getCommunity(state : Types.CommunitiesGroupsState, id : Types.CommunityId) : ?Types.Community {
    state.communities.get(id);
  };

  public func listCommunities(state : Types.CommunitiesGroupsState, cursor : ?Nat, limit : Nat) : [Types.CommunitySummary] {
    let effectiveLimit = if (limit == 0 or limit > 50) { 20 } else { limit };
    let (ids, _, _) = paginateIds(state.communities, cursor, effectiveLimit);
    let result = List.empty<Types.CommunitySummary>();
    for (id in ids.values()) {
      switch (state.communities.get(id)) {
        case (?c) { result.add(toCommunitySummary(state, c)) };
        case (null) {};
      };
    };
    result.toArray();
  };

  public func searchCommunities(state : Types.CommunitiesGroupsState, searchText : Text, limit : Nat) : [Types.CommunitySummary] {
    if (searchText == "") { return [] };
    let effectiveLimit = if (limit == 0 or limit > 50) { 20 } else { limit };
    let result = List.empty<Types.CommunitySummary>();
    for ((_, c) in state.communities.entries()) {
      if (result.size() >= effectiveLimit) { return result.toArray() };
      if (textContains(c.name, searchText)) {
        result.add(toCommunitySummary(state, c));
      };
    };
    result.toArray();
  };

  public func createGroup(state : Types.CommunitiesGroupsState, communityId : Types.CommunityId, creator : Principal, name : Text, description : Text, coverImageHash : ?Storage.ExternalBlob) : Types.Group {
    switch (state.communities.get(communityId)) {
      case (null) { Runtime.trap("Community not found") };
      case (?_) {};
    };
    if (name == "") { Runtime.trap("Group name cannot be empty") };
    if (description == "") { Runtime.trap("Group description cannot be empty") };
    let communityGroups = communityGroupsOf(state, communityId);
    if (communityGroups.size() >= maxGroupsPerCommunity) {
      Runtime.trap("Community group limit reached (100,000 groups max)");
    };
    let id = state.nextGroupId;
    state.nextGroupId += 1;
    let group : Types.Group = {
      id;
      communityId;
      name;
      description;
      coverImageHash;
      creator;
      createdAt = Time.now();
    };
    state.groups.add(id, group);
    communityGroups.add(id, true);
    group;
  };

  public func getGroup(state : Types.CommunitiesGroupsState, id : Types.GroupId) : ?Types.Group {
    state.groups.get(id);
  };

  public func listGroupsByCommunity(state : Types.CommunitiesGroupsState, communityId : Types.CommunityId, cursor : ?Nat, limit : Nat) : Types.PaginatedGroups {
    let effectiveLimit = if (limit == 0 or limit > 50) { 20 } else { limit };
    let communityGroups = communityGroupsOf(state, communityId);
    let (ids, nextCursor, hasMore) = paginateIds(communityGroups, cursor, effectiveLimit);
    let result = List.empty<Types.GroupSummary>();
    for (id in ids.values()) {
      switch (state.groups.get(id)) {
        case (?g) { result.add(toGroupSummary(state, g)) };
        case (null) {};
      };
    };
    { groups = result.toArray(); nextCursor; hasMore };
  };

  public func searchGroups(state : Types.CommunitiesGroupsState, searchText : Text, limit : Nat) : [Types.GroupSummary] {
    if (searchText == "") { return [] };
    let effectiveLimit = if (limit == 0 or limit > 50) { 20 } else { limit };
    let result = List.empty<Types.GroupSummary>();
    for ((_, g) in state.groups.entries()) {
      if (result.size() >= effectiveLimit) { return result.toArray() };
      if (textContains(g.name, searchText)) {
        result.add(toGroupSummary(state, g));
      };
    };
    result.toArray();
  };

  public func joinGroup(state : Types.CommunitiesGroupsState, groupId : Types.GroupId, member : Principal) : () {
    switch (state.groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?_) {};
    };
    let members = membersOf(state, groupId);
    if (members.get(member) != null) { return };
    if (members.size() >= maxMembersPerGroup) {
      Runtime.trap("Group member limit reached (100,000 members max)");
    };
    members.add(member, { principal = member; joinedAt = Time.now() });
    userMembershipsOf(state, member).add(groupId, true);
  };

  public func leaveGroup(state : Types.CommunitiesGroupsState, groupId : Types.GroupId, member : Principal) : () {
    membersOf(state, groupId).remove(member);
    userMembershipsOf(state, member).remove(groupId);
  };

  public func getGroupMembers(state : Types.CommunitiesGroupsState, groupId : Types.GroupId, offset : Nat, limit : Nat) : [Types.GroupMember] {
    let effectiveLimit = if (limit == 0 or limit > 50) { 20 } else { limit };
    let members = membersOf(state, groupId);
    let result = List.empty<Types.GroupMember>();
    var skipped : Nat = 0;
    var collected : Nat = 0;
    for ((_, m) in members.entries()) {
      if (skipped < offset) {
        skipped += 1;
      } else if (collected < effectiveLimit) {
        result.add(m);
        collected += 1;
      };
    };
    result.toArray();
  };

  public func isGroupMember(state : Types.CommunitiesGroupsState, groupId : Types.GroupId, member : Principal) : Bool {
    switch (state.groupMembers.get(groupId)) {
      case (?m) { m.get(member) != null };
      case (null) { false };
    };
  };

  public func createGroupPost(state : Types.CommunitiesGroupsState, groupId : Types.GroupId, author : Principal, text : Text, mediaHash : ?Storage.ExternalBlob, mediaType : ?Text) : Types.GroupPost {
    switch (state.groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?_) {};
    };
    if (not isGroupMember(state, groupId, author)) {
      Runtime.trap("Must be a group member to post");
    };
    if (text == "" and mediaHash == null) {
      Runtime.trap("Group post must contain text or media");
    };
    let id = state.nextGroupPostId;
    state.nextGroupPostId += 1;
    let post : Types.GroupPost = {
      id;
      groupId;
      author;
      text;
      mediaHash;
      mediaType;
      createdAt = Time.now();
    };
    state.groupPostsById.add(id, post);
    groupPostsOf(state, groupId).add(id, true);
    post;
  };

  public func getGroupFeed(state : Types.CommunitiesGroupsState, groupId : Types.GroupId, cursor : ?Nat, limit : Nat) : Types.PaginatedGroupPosts {
    let effectiveLimit = if (limit == 0 or limit > 50) { 20 } else { limit };
    let posts = groupPostsOf(state, groupId);
    let (ids, nextCursor, hasMore) = paginateIds(posts, cursor, effectiveLimit);
    let result = List.empty<Types.GroupPost>();
    for (id in ids.values()) {
      switch (state.groupPostsById.get(id)) {
        case (?p) { result.add(p) };
        case (null) {};
      };
    };
    { posts = result.toArray(); nextCursor; hasMore };
  };

  public func getGroupPost(state : Types.CommunitiesGroupsState, postId : Nat) : ?Types.GroupPost {
    state.groupPostsById.get(postId);
  };
};
