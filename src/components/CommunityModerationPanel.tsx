import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Eye, Search, ShieldAlert, Trash2, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

type ModerationStatus = "pending" | "approved" | "removed";

type ConnectionPost = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  location: string;
  location_tags?: string[];
  interests: string[];
  moderation_status: ModerationStatus;
  created_at: string;
};

type ConnectionReply = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  moderation_status: ModerationStatus;
  created_at: string;
};

type UserModeration = {
  user_id: string;
  strike_count: number;
  is_removed: boolean;
  removal_reason: string | null;
  updated_at: string;
};

type UserProfile = {
  id: string;
  username: string | null;
  community_display_name: string | null;
};

type DecisionAction =
  | { type: "reject_post"; post: ConnectionPost }
  | { type: "delete_reply"; reply: ConnectionReply };

const PAGE_SIZE = 6;

export function CommunityModerationPanel() {
  const { session } = useAuth();
  const [posts, setPosts] = useState<ConnectionPost[]>([]);
  const [replies, setReplies] = useState<ConnectionReply[]>([]);
  const [userModerationRows, setUserModerationRows] = useState<UserModeration[]>([]);
  const [actionReason, setActionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [profilesById, setProfilesById] = useState<Record<string, UserProfile>>({});
  const [emailsById, setEmailsById] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [postStatusFilter, setPostStatusFilter] = useState<"all" | ModerationStatus>("all");
  const [replyStatusFilter, setReplyStatusFilter] = useState<"all" | ModerationStatus>("all");
  const [userStatusFilter, setUserStatusFilter] = useState<"all" | "active" | "removed">("all");
  const [postPage, setPostPage] = useState(1);
  const [replyPage, setReplyPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [selectedPostForReplies, setSelectedPostForReplies] = useState<ConnectionPost | null>(null);
  const [decisionAction, setDecisionAction] = useState<DecisionAction | null>(null);
  const [decisionReason, setDecisionReason] = useState("");

  const userIds = useMemo(() => {
    const postUsers = posts.map((post) => post.user_id);
    const replyUsers = replies.map((reply) => reply.user_id);
    const moderationUsers = userModerationRows.map((row) => row.user_id);
    return Array.from(new Set([...postUsers, ...replyUsers, ...moderationUsers])).sort();
  }, [posts, replies, userModerationRows]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [{ data: postsData, error: postsError }, { data: repliesData, error: repliesError }, { data: userModData, error: userModError }] =
      await Promise.all([
        supabase
          .from("connection_posts")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("connection_replies")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("connection_user_moderation")
          .select("*")
          .order("updated_at", { ascending: false }),
      ]);

    if (postsError || repliesError || userModError) {
      const detail = postsError?.message ?? repliesError?.message ?? userModError?.message ?? "Unknown error";
      toast.error(`Unable to load community moderation data: ${detail}`);
      setLoading(false);
      return;
    }

    setPosts((postsData ?? []) as ConnectionPost[]);
    setReplies((repliesData ?? []) as ConnectionReply[]);
    setUserModerationRows((userModData ?? []) as UserModeration[]);

    const ids = Array.from(
      new Set([
        ...((postsData ?? []) as ConnectionPost[]).map((post) => post.user_id),
        ...((repliesData ?? []) as ConnectionReply[]).map((reply) => reply.user_id),
        ...((userModData ?? []) as UserModeration[]).map((row) => row.user_id),
      ]),
    );

    if (ids.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, community_display_name")
        .in("id", ids);

      const nextProfilesById = (profilesData ?? []).reduce<Record<string, UserProfile>>((acc, profile) => {
        acc[profile.id] = profile as UserProfile;
        return acc;
      }, {});
      setProfilesById(nextProfilesById);

      const token = session?.access_token;
      if (token) {
        const res = await fetch("/api/admin-users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const payload = (await res.json().catch(() => ({}))) as {
            users?: { id: string; email: string | null }[];
          };
          const nextEmailsById = (payload.users ?? []).reduce<Record<string, string>>((acc, user) => {
            if (user.email) acc[user.id] = user.email;
            return acc;
          }, {});
          setEmailsById(nextEmailsById);
        }
      }
    } else {
      setProfilesById({});
      setEmailsById({});
    }

    setLoading(false);
  }, [session?.access_token]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const getUserLabel = useCallback((userId: string) => {
    const profile = profilesById[userId];
    const nick = profile?.community_display_name?.trim();
    if (nick) return nick;
    if (profile?.username) return `@${profile.username}`;
    return `User ${userId.slice(0, 8)}`;
  }, [profilesById]);

  const getUserEmail = useCallback((userId: string) => emailsById[userId] ?? "No email", [emailsById]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const statusMatch = postStatusFilter === "all" || post.moderation_status === postStatusFilter;
      if (!statusMatch) return false;
      if (!normalizedQuery) return true;
      const userLabel = getUserLabel(post.user_id).toLowerCase();
      const email = getUserEmail(post.user_id).toLowerCase();
      return (
        post.title.toLowerCase().includes(normalizedQuery) ||
        post.body.toLowerCase().includes(normalizedQuery) ||
        post.location.toLowerCase().includes(normalizedQuery) ||
        (post.location_tags ?? []).some((tag) => tag.toLowerCase().includes(normalizedQuery)) ||
        userLabel.includes(normalizedQuery) ||
        email.includes(normalizedQuery)
      );
    });
  }, [posts, postStatusFilter, normalizedQuery, getUserLabel, getUserEmail]);

  const filteredReplies = useMemo(() => {
    return replies.filter((reply) => {
      const statusMatch = replyStatusFilter === "all" || reply.moderation_status === replyStatusFilter;
      if (!statusMatch) return false;
      if (!normalizedQuery) return true;
      const userLabel = getUserLabel(reply.user_id).toLowerCase();
      const email = getUserEmail(reply.user_id).toLowerCase();
      return (
        reply.content.toLowerCase().includes(normalizedQuery) ||
        userLabel.includes(normalizedQuery) ||
        email.includes(normalizedQuery)
      );
    });
  }, [replies, replyStatusFilter, normalizedQuery, getUserLabel, getUserEmail]);

  const filteredUsers = useMemo(() => {
    return userIds.filter((userId) => {
      const row = userModerationRows.find((item) => item.user_id === userId);
      const statusMatch =
        userStatusFilter === "all" ||
        (userStatusFilter === "removed" && !!row?.is_removed) ||
        (userStatusFilter === "active" && !row?.is_removed);
      if (!statusMatch) return false;
      if (!normalizedQuery) return true;
      return (
        getUserLabel(userId).toLowerCase().includes(normalizedQuery) ||
        getUserEmail(userId).toLowerCase().includes(normalizedQuery) ||
        userId.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [userIds, userModerationRows, userStatusFilter, normalizedQuery, getUserLabel, getUserEmail]);

  const paginate = <T,>(items: T[], page: number) => {
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return {
      totalPages,
      safePage,
      items: items.slice(start, start + PAGE_SIZE),
    };
  };

  const pagedPosts = paginate(filteredPosts, postPage);
  const pagedReplies = paginate(filteredReplies, replyPage);
  const pagedUsers = paginate(filteredUsers, userPage);

  const addEvent = async (
    targetTable: "connection_posts" | "connection_replies" | "connection_user_moderation",
    targetId: string | null,
    action: "approved" | "removed" | "strike_added" | "user_removed",
    actedOnUserId: string,
    reason?: string,
  ) => {
    const { data } = await supabase.auth.getUser();
    const actedBy = data.user?.id ?? null;
    await supabase.from("connection_moderation_events").insert({
      target_table: targetTable,
      target_id: targetId,
      action,
      reason: (reason ?? actionReason.trim()) || null,
      acted_by: actedBy,
      acted_on_user_id: actedOnUserId,
    });
  };

  const updatePostStatus = async (post: ConnectionPost, status: ModerationStatus, reason?: string) => {
    const payload =
      status === "approved"
        ? { moderation_status: "approved", moderation_reason: null, removed_at: null, removed_by: null }
        : { moderation_status: "removed", moderation_reason: (reason ?? actionReason.trim()) || null, removed_at: new Date().toISOString() };

    const { error } = await supabase.from("connection_posts").update(payload).eq("id", post.id);
    if (error) {
      toast.error("Unable to update post moderation status.");
      return;
    }

    await addEvent("connection_posts", post.id, status === "approved" ? "approved" : "removed", post.user_id, reason);
    toast.success(status === "approved" ? "Post approved." : "Post rejected.");
    await loadAll();
  };

  const deleteReply = async (reply: ConnectionReply, reason: string) => {
    const payload = { moderation_status: "removed", moderation_reason: reason, removed_at: new Date().toISOString() };

    const { error } = await supabase.from("connection_replies").update(payload).eq("id", reply.id);
    if (error) {
      toast.error("Unable to delete reply.");
      return;
    }

    await addEvent("connection_replies", reply.id, "removed", reply.user_id, reason);
    toast.success("Reply deleted.");
    await loadAll();
  };

  const openRejectPostDialog = (post: ConnectionPost) => {
    setDecisionAction({ type: "reject_post", post });
    setDecisionReason("");
  };

  const openDeleteReplyDialog = (reply: ConnectionReply) => {
    setDecisionAction({ type: "delete_reply", reply });
    setDecisionReason("");
  };

  const confirmDecision = async () => {
    const reason = decisionReason.trim();
    if (!reason) {
      toast.error("Reason is required.");
      return;
    }
    if (!decisionAction) return;
    if (decisionAction.type === "reject_post") {
      await updatePostStatus(decisionAction.post, "removed", reason);
    } else {
      await deleteReply(decisionAction.reply, reason);
    }
    setDecisionAction(null);
    setDecisionReason("");
  };

  const selectedPostReplies = useMemo(() => {
    if (!selectedPostForReplies) return [];
    return replies
      .filter((reply) => reply.post_id === selectedPostForReplies.id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [selectedPostForReplies, replies]);

  const addStrike = async (userId: string) => {
    const { data: current } = await supabase
      .from("connection_user_moderation")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const nextStrikes = (current?.strike_count ?? 0) + 1;
    const { error } = await supabase.from("connection_user_moderation").upsert({
      user_id: userId,
      strike_count: nextStrikes,
      is_removed: current?.is_removed ?? false,
      removal_reason: current?.removal_reason ?? null,
      removed_at: current?.removed_at ?? null,
    });

    if (error) {
      toast.error("Unable to add strike.");
      return;
    }

    await addEvent("connection_user_moderation", userId, "strike_added", userId);
    toast.success("Strike added.");
    await loadAll();
  };

  const setUserRemoval = async (userId: string, isRemoved: boolean) => {
    const { data: current } = await supabase
      .from("connection_user_moderation")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const { error } = await supabase.from("connection_user_moderation").upsert({
      user_id: userId,
      strike_count: current?.strike_count ?? 0,
      is_removed: isRemoved,
      removal_reason: isRemoved ? actionReason.trim() || "Removed by admin moderation" : null,
      removed_at: isRemoved ? new Date().toISOString() : null,
    });

    if (error) {
      toast.error(isRemoved ? "Unable to remove user." : "Unable to reinstate user.");
      return;
    }

    await addEvent("connection_user_moderation", userId, "user_removed", userId);
    toast.success(isRemoved ? "User removed from community posting." : "User reinstated.");
    await loadAll();
  };

  const renderPagination = (
    totalPages: number,
    currentPage: number,
    onChange: (page: number) => void,
    showPageText = false,
  ) => {
    const pages = Array.from({ length: totalPages }, (_, idx) => idx + 1);
    return (
      <div className="space-y-2">
        {showPageText && (
          <p className="text-center text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
        )}
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  if (currentPage === 1) return;
                  onChange(Math.max(1, currentPage - 1));
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {pages.map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  href="#"
                  isActive={pageNumber === currentPage}
                  onClick={(event) => {
                    event.preventDefault();
                    onChange(pageNumber);
                  }}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  if (currentPage === totalPages) return;
                  onChange(Math.min(totalPages, currentPage + 1));
                }}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Community Moderation Hub
          </CardTitle>
          <CardDescription>
            Moderate posts quickly with searchable queues, status filters, per-post reply review, and pagination.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Posts</p>
              <p className="text-2xl font-semibold">{posts.length}</p>
              <p className="text-xs text-muted-foreground">
                Pending {posts.filter((p) => p.moderation_status === "pending").length} · Approved{" "}
                {posts.filter((p) => p.moderation_status === "approved").length}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Replies</p>
              <p className="text-2xl font-semibold">{replies.length}</p>
              <p className="text-xs text-muted-foreground">
                Approved {replies.filter((r) => r.moderation_status === "approved").length} · Removed{" "}
                {replies.filter((r) => r.moderation_status === "removed").length}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Pending Post Review</p>
              <p className="text-2xl font-semibold">
                {posts.filter((p) => p.moderation_status === "pending").length}
              </p>
              <p className="text-xs text-muted-foreground">
                Approve or reject each original post.
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Moderated Users</p>
              <p className="text-2xl font-semibold flex items-center gap-1">
                <Users className="h-4 w-4" />
                {userIds.length}
              </p>
              <p className="text-xs text-muted-foreground">
                Removed {userModerationRows.filter((u) => u.is_removed).length}
              </p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_280px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPostPage(1);
                  setReplyPage(1);
                  setUserPage(1);
                }}
                placeholder="Search by title, content, nickname, username, email, or user ID"
              />
            </div>
            <Input
              value={actionReason}
              onChange={(event) => setActionReason(event.target.value)}
              placeholder="Optional moderation reason"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="posts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="replies">Replies</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Posts Queue</CardTitle>
                  <CardDescription>Original posts require explicit admin approval or rejection.</CardDescription>
                </div>
                <div className="flex gap-2">
                  {(["all", "pending", "approved", "removed"] as const).map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={postStatusFilter === status ? "default" : "outline"}
                      onClick={() => {
                        setPostStatusFilter(status);
                        setPostPage(1);
                      }}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading && <p className="text-sm text-muted-foreground">Loading moderation queue...</p>}
              {!loading && pagedPosts.items.length === 0 && (
                <p className="text-sm text-muted-foreground">No posts found for this filter.</p>
              )}
              {pagedPosts.items.map((post) => (
                <div key={post.id} className="rounded-lg border p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <h4 className="font-medium">{post.title}</h4>
                    <Badge variant={post.moderation_status === "pending" ? "secondary" : "outline"}>{post.moderation_status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {(post.location_tags?.length ? post.location_tags.join(", ") : post.location)} · by {getUserLabel(post.user_id)} · {new Date(post.created_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">{getUserEmail(post.user_id)}</p>
                  <p className="text-sm mb-3 whitespace-pre-wrap">{post.body}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={post.moderation_status === "approved"}
                      onClick={() => void updatePostStatus(post, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={post.moderation_status === "removed"}
                      onClick={() => openRejectPostDialog(post)}
                    >
                      Reject
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSelectedPostForReplies(post)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View replies
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void addStrike(post.user_id)}>
                      Add strike
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void setUserRemoval(post.user_id, true)}>
                      Remove user
                    </Button>
                  </div>
                </div>
              ))}
              {pagedPosts.items.length > 0 && renderPagination(pagedPosts.totalPages, pagedPosts.safePage, setPostPage, true)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="replies">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Replies</CardTitle>
                  <CardDescription>
                    Replies are published immediately. Use this tab to monitor replies and remove if needed.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {(["all", "approved", "removed"] as const).map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={replyStatusFilter === status ? "default" : "outline"}
                      onClick={() => {
                        setReplyStatusFilter(status);
                        setReplyPage(1);
                      }}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {!loading && pagedReplies.items.length === 0 && (
                <p className="text-sm text-muted-foreground">No replies found for this filter.</p>
              )}
              {pagedReplies.items.map((reply) => (
                <div key={reply.id} className="rounded-lg border p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">Reply by {getUserLabel(reply.user_id)}</p>
                    <Badge variant={reply.moderation_status === "approved" ? "outline" : "secondary"}>{reply.moderation_status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{getUserEmail(reply.user_id)}</p>
                  <p className="text-sm mb-3 whitespace-pre-wrap">{reply.content}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={reply.moderation_status === "removed"}
                      onClick={() => openDeleteReplyDialog(reply)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete reply
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void addStrike(reply.user_id)}>
                      Add strike
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void setUserRemoval(reply.user_id, true)}>
                      Remove user
                    </Button>
                  </div>
                </div>
              ))}
              {renderPagination(pagedReplies.totalPages, pagedReplies.safePage, setReplyPage)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>User Moderation</CardTitle>
                  <CardDescription>Manage repeat offenders and reinstate users.</CardDescription>
                </div>
                <div className="flex gap-2">
                  {(["all", "active", "removed"] as const).map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={userStatusFilter === status ? "default" : "outline"}
                      onClick={() => {
                        setUserStatusFilter(status);
                        setUserPage(1);
                      }}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {pagedUsers.items.length === 0 && <p className="text-sm text-muted-foreground">No users found for this filter.</p>}
              {pagedUsers.items.map((userId) => {
                const row = userModerationRows.find((item) => item.user_id === userId);
                return (
                  <div key={userId} className="rounded-lg border p-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">{getUserLabel(userId)}</p>
                      <p className="text-xs text-muted-foreground">{getUserEmail(userId)}</p>
                      <p className="font-mono text-xs text-muted-foreground">{userId}</p>
                      <p className="text-xs text-muted-foreground">
                        Strikes: {row?.strike_count ?? 0} · Status: {row?.is_removed ? "Removed" : "Active"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => void addStrike(userId)}>
                        Add strike
                      </Button>
                      {row?.is_removed ? (
                        <Button size="sm" onClick={() => void setUserRemoval(userId, false)}>
                          Reinstate
                        </Button>
                      ) : (
                        <Button size="sm" variant="destructive" onClick={() => void setUserRemoval(userId, true)}>
                          Remove user
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              {renderPagination(pagedUsers.totalPages, pagedUsers.safePage, setUserPage)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedPostForReplies} onOpenChange={(open) => !open && setSelectedPostForReplies(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Replies for: {selectedPostForReplies?.title ?? "Post"}</DialogTitle>
            <DialogDescription>
              Review replies in this conversation and delete individual replies when needed.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[420px] overflow-y-auto space-y-3">
            {selectedPostReplies.length === 0 && (
              <p className="text-sm text-muted-foreground">No replies on this post yet.</p>
            )}
            {selectedPostReplies.map((reply) => (
              <div key={reply.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">{getUserLabel(reply.user_id)}</p>
                    <p className="text-xs text-muted-foreground">{getUserEmail(reply.user_id)}</p>
                  </div>
                  <Badge variant={reply.moderation_status === "approved" ? "outline" : "secondary"}>{reply.moderation_status}</Badge>
                </div>
                <p className="text-sm whitespace-pre-wrap mb-3">{reply.content}</p>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={reply.moderation_status === "removed"}
                  onClick={() => openDeleteReplyDialog(reply)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete reply
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!decisionAction} onOpenChange={(open) => !open && setDecisionAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decisionAction?.type === "reject_post" ? "Reject post" : "Delete reply"}
            </DialogTitle>
            <DialogDescription>
              Please enter the reason. This reason is required and will be stored in moderation records.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={decisionReason}
            onChange={(event) => setDecisionReason(event.target.value)}
            placeholder={decisionAction?.type === "reject_post" ? "Reason for rejecting this post..." : "Reason for deleting this reply..."}
            rows={4}
            required
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionAction(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void confirmDecision()}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
