import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Filter, MapPin, MessageCircle, PlusCircle, ShieldAlert, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import communityHeroImg from "@/assets/images/Community.jpg";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ModerationStatus = "pending" | "approved" | "removed";

type ConnectionPost = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  location: string;
  interests: string[];
  moderation_status: ModerationStatus;
  created_at: string;
};

type ConnectionReply = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_reply_id: string | null;
  moderation_status: ModerationStatus;
  created_at: string;
};
type UserIdentity = {
  username: string | null;
  fullName: string | null;
  email: string | null;
};

const POSTING_RULES = [
  "Posts are for positive community connection only.",
  "No politics.",
  "All religions and beliefs are welcome, with no debating about which one is chosen.",
  "No harassment, shaming, or bullying.",
  "Agenda pushing, repeated abuse, or spam leads to removal. Repeat offenders can and will be removed from the app.",
  "Posts require admin approval. Replies appear immediately unless removed by moderation.",
];
const RULES_IGNORE_KEY = "community_rules_ignore_until";
const RULES_IGNORE_DURATION_MS = 24 * 60 * 60 * 1000;

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function CommunityConnections() {
  const POSTS_PAGE_SIZE = 6;
  const [posts, setPosts] = useState<ConnectionPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<ConnectionPost | null>(null);
  const [replies, setReplies] = useState<ConnectionReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [interestFilter, setInterestFilter] = useState("all");

  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newInterests, setNewInterests] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [rulesDialogOpen, setRulesDialogOpen] = useState(false);
  const [ignoreRulesForDay, setIgnoreRulesForDay] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [identitiesById, setIdentitiesById] = useState<Record<string, UserIdentity>>({});
  const [postsPage, setPostsPage] = useState(1);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadUserIdentities = useCallback(async (userIds: string[]) => {
    const ids = Array.from(new Set(userIds)).filter(Boolean);
    if (!ids.length) return;

    const { data: profiles } = await supabase.from("profiles").select("id, username").in("id", ids);
    const profileMap = (profiles ?? []).reduce<Record<string, { username: string | null }>>((acc, item) => {
      acc[item.id] = { username: item.username ?? null };
      return acc;
    }, {});

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    let apiUsers: { id: string; email: string | null; full_name: string | null }[] = [];
    if (token) {
      const res = await fetch("/api/community-users", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        const payload = (await res.json().catch(() => ({}))) as {
          users?: { id: string; email: string | null; full_name: string | null }[];
        };
        apiUsers = payload.users ?? [];
      }
    }

    setIdentitiesById((prev) => {
      const nextMap = { ...prev };
      ids.forEach((id) => {
        const apiUser = apiUsers.find((u) => u.id === id);
        nextMap[id] = {
          username: profileMap[id]?.username ?? null,
          fullName: apiUser?.full_name ?? null,
          email: apiUser?.email ?? null,
        };
      });
      return nextMap;
    });
  }, []);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    const queryBuilder = supabase
      .from("connection_posts")
      .select("*")
      .order("created_at", { ascending: false });

    const { data, error } = userId
      ? await queryBuilder.or(`moderation_status.eq.approved,user_id.eq.${userId}`)
      : await queryBuilder.eq("moderation_status", "approved");

    if (error) {
      toast.error("Unable to load community posts. Confirm schema is up to date.");
      setLoading(false);
      return;
    }

    setPosts((data ?? []) as ConnectionPost[]);
    await loadUserIdentities(((data ?? []) as ConnectionPost[]).map((post) => post.user_id));
    setLoading(false);
  }, [loadUserIdentities]);

  const loadReplies = useCallback(async (postId: string) => {
    const { data, error } = await supabase
      .from("connection_replies")
      .select("*")
      .eq("post_id", postId)
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Unable to load replies.");
      return;
    }

    setReplies((data ?? []) as ConnectionReply[]);
    await loadUserIdentities(((data ?? []) as ConnectionReply[]).map((reply) => reply.user_id));
  }, [loadUserIdentities]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ignoreUntilRaw = window.localStorage.getItem(RULES_IGNORE_KEY);
    const ignoreUntil = Number(ignoreUntilRaw ?? "0");
    const shouldShowDialog = !ignoreUntil || Number.isNaN(ignoreUntil) || Date.now() >= ignoreUntil;
    setIgnoreRulesForDay(false);
    setRulesDialogOpen(shouldShowDialog);
  }, []);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id ?? null);
    })();
  }, []);

  useEffect(() => {
    if (selectedPost) {
      void loadReplies(selectedPost.id);
    }
  }, [selectedPost, loadReplies]);

  const getAuthorName = (userId: string) => {
    const identity = identitiesById[userId];
    if (!identity) return "Community member";
    if (identity.fullName) return identity.fullName;
    if (identity.username) return `@${identity.username}`;
    return "Community member";
  };

  const getAuthorEmail = (userId: string) => identitiesById[userId]?.email ?? "No email";

  const allLocations = useMemo(
    () => Array.from(new Set(posts.map((post) => post.location).filter(Boolean))).sort(),
    [posts],
  );

  const allInterests = useMemo(
    () => Array.from(new Set(posts.flatMap((post) => post.interests ?? []))).sort(),
    [posts],
  );

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesQuery =
        !query ||
        post.title.toLowerCase().includes(query.toLowerCase()) ||
        post.body.toLowerCase().includes(query.toLowerCase()) ||
        post.location.toLowerCase().includes(query.toLowerCase()) ||
        post.interests.some((interest) => interest.toLowerCase().includes(query.toLowerCase()));

      const matchesLocation = locationFilter === "all" || post.location === locationFilter;
      const matchesInterest = interestFilter === "all" || post.interests.includes(interestFilter);
      return matchesQuery && matchesLocation && matchesInterest;
    });
  }, [posts, query, locationFilter, interestFilter]);

  const pagedPosts = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PAGE_SIZE));
    const safePage = Math.min(Math.max(postsPage, 1), totalPages);
    const start = (safePage - 1) * POSTS_PAGE_SIZE;
    return {
      totalPages,
      safePage,
      items: filteredPosts.slice(start, start + POSTS_PAGE_SIZE),
    };
  }, [filteredPosts, postsPage]);

  const parseInterests = (rawValue: string) =>
    Array.from(
      new Set(
        rawValue
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    );

  const handleCreatePost = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        throw new Error("You must be signed in to post.");
      }

      const interests = parseInterests(newInterests);
      if (!interests.length) {
        throw new Error("Add at least one interest tag.");
      }

      const { error } = await supabase.from("connection_posts").insert({
        user_id: userId,
        title: newTitle.trim(),
        body: newBody.trim(),
        location: newLocation.trim(),
        interests,
      });

      if (error) throw error;

      setNewTitle("");
      setNewBody("");
      setNewLocation("");
      setNewInterests("");
      toast.success("Post submitted for moderation approval.");
      setCreateDialogOpen(false);
      await loadPosts();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to create post."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedPost) return;

    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        throw new Error("You must be signed in to reply.");
      }

      const { error } = await supabase.from("connection_replies").insert({
        post_id: selectedPost.id,
        user_id: userId,
        content: replyBody.trim(),
        moderation_status: "approved",
      });
      if (error) throw error;

      setReplyBody("");
      toast.success("Reply posted.");
      await loadReplies(selectedPost.id);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to post reply."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRulesDialogChange = (open: boolean) => {
    if (!open && rulesDialogOpen && typeof window !== "undefined") {
      if (ignoreRulesForDay) {
        window.localStorage.setItem(RULES_IGNORE_KEY, String(Date.now() + RULES_IGNORE_DURATION_MS));
      } else {
        window.localStorage.removeItem(RULES_IGNORE_KEY);
      }
    }
    setRulesDialogOpen(open);
  };

  if (selectedPost) {
    const topLevelReplies = replies.filter((reply) => !reply.parent_reply_id);
    return (
      <div className="min-h-screen landing" style={{ backgroundColor: "var(--landing-bg)", color: "var(--landing-text)" }}>
        <Dialog open={rulesDialogOpen} onOpenChange={handleRulesDialogChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
                Community Safety Rules
              </DialogTitle>
              <DialogDescription>
                This board is for helpful, local, like-minded connection. Please follow these rules every time you post.
              </DialogDescription>
            </DialogHeader>
            <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {POSTING_RULES.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
            <div className="flex items-center space-x-2 rounded-md border p-3">
              <Checkbox
                id="ignore-community-rules-thread"
                checked={ignoreRulesForDay}
                onCheckedChange={(checked) => setIgnoreRulesForDay(checked === true)}
              />
              <Label htmlFor="ignore-community-rules-thread" className="cursor-pointer text-sm">
                Ignore for one day
              </Label>
            </div>
            <DialogFooter>
              <Button onClick={() => handleRulesDialogChange(false)}>Continue</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <div className="container mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <Button variant="ghost" className="mb-4" onClick={() => setSelectedPost(null)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to board
          </Button>

        <Card className="mb-6 border-[var(--landing-border)] bg-[var(--landing-accent)]/70">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{selectedPost.location}</Badge>
              {selectedPost.interests.map((interest) => (
                <Badge key={interest}>{interest}</Badge>
              ))}
            </div>
            <CardTitle className="text-2xl">{selectedPost.title}</CardTitle>
            <CardDescription>
              Posted {new Date(selectedPost.created_at).toLocaleString()}{" "}
              {selectedPost.moderation_status !== "approved" ? "(awaiting moderation)" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{selectedPost.body}</p>
          </CardContent>
        </Card>

        <Card className="mb-6 border-[var(--landing-border)] bg-[var(--landing-accent)]/70">
          <CardHeader>
            <CardTitle className="text-lg">Threaded Conversation</CardTitle>
            <CardDescription>
              Replies remain visible after moderation approval; this keeps conversations constructive.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topLevelReplies.map((reply) => (
              <div key={reply.id} className={`flex ${reply.user_id === currentUserId ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    reply.user_id === currentUserId
                      ? "bg-[var(--landing-primary)] text-white"
                      : "border border-[var(--landing-border)] bg-white/80 text-foreground"
                  }`}
                >
                  <p className={`mb-1 text-xs ${reply.user_id === currentUserId ? "text-white/80" : "text-muted-foreground"}`}>
                    {getAuthorName(reply.user_id)} · {getAuthorEmail(reply.user_id)}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                  <p className={`mt-2 text-[11px] ${reply.user_id === currentUserId ? "text-white/70" : "text-muted-foreground"}`}>
                    {new Date(reply.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {!topLevelReplies.length && (
              <p className="text-sm text-muted-foreground">No replies yet. Start the conversation respectfully.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-[var(--landing-border)] bg-[var(--landing-accent)]/70">
          <CardHeader>
            <CardTitle className="text-lg">Add a Reply</CardTitle>
            <CardDescription>Keep it kind, local, and interest-focused.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleReply}>
              <Textarea
                value={replyBody}
                onChange={(event) => setReplyBody(event.target.value)}
                placeholder="Share advice, ask follow-up questions, or offer to connect."
                rows={4}
                required
              />
              <Button type="submit" disabled={submitting}>
                <MessageCircle className="mr-2 h-4 w-4" />
                {submitting ? "Submitting..." : "Submit Reply"}
              </Button>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen landing" style={{ backgroundColor: "var(--landing-bg)", color: "var(--landing-text)" }}>
      <Dialog open={rulesDialogOpen} onOpenChange={handleRulesDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              Community Safety Rules
            </DialogTitle>
            <DialogDescription>
              This board is for helpful, local, like-minded connection. Please follow these rules every time you post.
            </DialogDescription>
          </DialogHeader>
          <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
            {POSTING_RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
          <div className="flex items-center space-x-2 rounded-md border p-3">
            <Checkbox
              id="ignore-community-rules-list"
              checked={ignoreRulesForDay}
              onCheckedChange={(checked) => setIgnoreRulesForDay(checked === true)}
            />
            <Label htmlFor="ignore-community-rules-list" className="cursor-pointer text-sm">
              Ignore for one day
            </Label>
          </div>
          <DialogFooter>
            <Button onClick={() => handleRulesDialogChange(false)}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <section
        className="relative overflow-hidden border-b border-[var(--landing-border)]"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(12, 24, 26, 0.72), rgba(18, 60, 52, 0.5)), url(${communityHeroImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-medium text-white">
            <Sparkles className="h-3.5 w-3.5 text-[var(--landing-primary)]" />
            Positive conversations, real-world connections
          </div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Community Connection Board</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/90 sm:text-base">
            Connect by location and shared interests. This space is built for positive support, practical advice, and meaningful local collaboration.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge variant="outline" className="border-white/40 bg-white/20 text-white">
              <Users className="mr-1 h-3.5 w-3.5" />
              {posts.length} active posts
            </Badge>
            <Badge variant="outline" className="border-white/40 bg-white/20 text-white">
              <MapPin className="mr-1 h-3.5 w-3.5" />
              {allLocations.length} locations
            </Badge>
            <Badge variant="outline" className="border-white/40 bg-white/20 text-white">
              <Filter className="mr-1 h-3.5 w-3.5" />
              {allInterests.length} interests
            </Badge>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex justify-end">
          <div className="flex gap-2">
            <Button onClick={() => setCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </div>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Create Connection Post</DialogTitle>
              <DialogDescription>
                Example: "Grand Forks, ND - Looking for RC airplane flyers."
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-3" onSubmit={handleCreatePost}>
              <Input
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="Post title"
                maxLength={120}
                required
              />
              <Input
                value={newLocation}
                onChange={(event) => setNewLocation(event.target.value)}
                placeholder="Location (city, state, or area)"
                maxLength={80}
                required
              />
              <Input
                value={newInterests}
                onChange={(event) => setNewInterests(event.target.value)}
                placeholder="Interests (comma-separated)"
                maxLength={200}
                required
              />
              <Textarea
                value={newBody}
                onChange={(event) => setNewBody(event.target.value)}
                placeholder="What are you looking for? Ask for advice or local connections."
                rows={5}
                maxLength={1000}
                required
              />
              <p className="text-right text-xs text-muted-foreground">{newBody.length}/1000</p>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {submitting ? "Submitting..." : "Submit for Approval"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Card className="border-[var(--landing-border)] bg-[var(--landing-accent)]/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Browse Connections</CardTitle>
            <CardDescription>Filter by location or interest and join an ongoing thread.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid gap-3 md:grid-cols-3">
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPostsPage(1);
                }}
                placeholder="Search posts"
              />
              <Select value={locationFilter} onValueChange={(value) => {
                setLocationFilter(value);
                setPostsPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {allLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={interestFilter} onValueChange={(value) => {
                setInterestFilter(value);
                setPostsPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter interest" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All interests</SelectItem>
                  {allInterests.map((interest) => (
                    <SelectItem key={interest} value={interest}>
                      {interest}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              Showing {filteredPosts.length} connection post{filteredPosts.length === 1 ? "" : "s"}
            </div>

            <div className="space-y-3">
              {loading && <p className="text-sm text-muted-foreground">Loading posts...</p>}
              {!loading &&
                pagedPosts.items.map((post) => (
                  <button
                    key={post.id}
                    className="w-full rounded-xl border border-[var(--landing-border)] bg-white/70 p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                    onClick={() => setSelectedPost(post)}
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="bg-white">
                        <MapPin className="mr-1 h-3 w-3" />
                        {post.location}
                      </Badge>
                      {(post.interests ?? []).slice(0, 3).map((interest) => (
                        <Badge key={interest}>{interest}</Badge>
                      ))}
                      {post.moderation_status !== "approved" && <Badge variant="secondary">Pending review</Badge>}
                    </div>
                    <h3 className="font-semibold">{post.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {getAuthorName(post.user_id)} · {getAuthorEmail(post.user_id)}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.body}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      <span>Open conversation</span>
                    </div>
                  </button>
                ))}
              {!loading && !filteredPosts.length && (
                <p className="text-sm text-muted-foreground">
                  No connection posts found. Try different filters or create a new one.
                </p>
              )}
              {!loading && filteredPosts.length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-center text-xs text-muted-foreground">
                    Page {pagedPosts.safePage} of {pagedPosts.totalPages}
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            if (pagedPosts.safePage === 1) return;
                            setPostsPage((prev) => Math.max(1, prev - 1));
                          }}
                          className={pagedPosts.safePage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {Array.from({ length: pagedPosts.totalPages }, (_, idx) => idx + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            isActive={page === pagedPosts.safePage}
                            onClick={(event) => {
                              event.preventDefault();
                              setPostsPage(page);
                            }}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            if (pagedPosts.safePage === pagedPosts.totalPages) return;
                            setPostsPage((prev) => Math.min(pagedPosts.totalPages, prev + 1));
                          }}
                          className={pagedPosts.safePage === pagedPosts.totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
