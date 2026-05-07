import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowUp, MessageCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import * as communityAPI from "@/api/communityApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(email = "") {
  return email
    .split("@")[0]
    .split(/[._-]/)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── CommentCard ──────────────────────────────────────────────────────────────

function CommentCard({ comment }) {
  const initials = getInitials(comment.created_by);

  return (
    <div className="flex gap-3 mb-4">
      {/* Avatar */}
      <div className="w-9 h-9 min-w-[36px] rounded-full bg-teal-50 flex items-center justify-center text-xs font-medium text-teal-700 select-none">
        {initials}
      </div>

      {/* Bubble */}
      <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
        <p className="text-xs font-medium text-slate-700">{comment.created_by}</p>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap">
          {comment.content}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-slate-400">{timeAgo(comment.created_date)}</span>
          <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-teal-600 transition-colors">
            <ArrowUp className="w-3 h-3" />
            <span>0</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ThreadPage ───────────────────────────────────────────────────────────────

export default function ThreadPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [commentText, setCommentText] = useState("");
  const [commentPage, setCommentPage] = useState(1);

  // ── Fetch thread + paginated comments ────────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ["thread", id, commentPage],
    queryFn: () => communityAPI.getThread(id, commentPage),
  });

  // ── Post comment ─────────────────────────────────────────────────────────
  const { mutate: postComment, isPending } = useMutation({
    mutationFn: () =>
      communityAPI.addComment(id, {
        content: commentText.trim(),
        created_by: "test@example.com", // 🔁 replace with real auth user email
      }),
    onSuccess: () => {
      setCommentText("");
      setCommentPage(1);
      // Invalidate all pages of this thread so counts + comments refresh
      queryClient.invalidateQueries({ queryKey: ["thread", id] });
    },
  });

  const handlePost = () => {
    if (!commentText.trim() || isPending) return;
    postComment();
  };

  // ── Loading / error states ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-400 text-sm">
        Loading thread...
      </div>
    );
  }

  if (isError || !data?.thread) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-400 text-sm">
        Failed to load thread. Please try again.
      </div>
    );
  }

  const { thread, comments = [], total_comments = 0, pages: totalPages = 1 } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* ── Back button ─────────────────────────────────────────────────── */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-teal-600 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to forum
        </button>

        {/* ── Thread card ──────────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <h1 className="text-xl font-semibold text-slate-800">{thread.title}</h1>
          <p className="mt-2 text-slate-600 leading-relaxed whitespace-pre-wrap">
            {thread.content}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-slate-400">
            <span>by {thread.created_by}</span>
            <span>·</span>
            <span>{timeAgo(thread.created_date)}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {total_comments} {total_comments === 1 ? "comment" : "comments"}
            </span>
          </div>
        </div>

        <hr className="border-slate-200 mb-6" />

        {/* ── Comment input ────────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-8">
          <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-teal-500" />
            Add a comment
          </p>
          <Textarea
            placeholder="Share your thoughts..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="resize-none"
            rows={3}
            // Allow Ctrl+Enter to submit
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handlePost();
            }}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-400">Ctrl + Enter to post</span>
            <Button
              onClick={handlePost}
              disabled={isPending || !commentText.trim()}
              className="bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50"
            >
              {isPending ? "Posting..." : "Post comment"}
            </Button>
          </div>
        </div>

        {/* ── Comments list ────────────────────────────────────────────────── */}
        <h2 className="text-sm font-medium text-slate-500 mb-4">
          {total_comments} {total_comments === 1 ? "comment" : "comments"}
        </h2>

        {comments.length === 0 ? (
          <p className="text-center text-slate-400 py-12 text-sm">
            No comments yet — be the first to reply!
          </p>
        ) : (
          <div>
            {comments.map((c) => (
              <CommentCard key={c.id} comment={c} />
            ))}
          </div>
        )}

        {/* ── Comment pagination ───────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <Button
              variant="outline"
              disabled={commentPage === 1}
              onClick={() => setCommentPage((p) => p - 1)}
            >
              Prev
            </Button>
            <span className="text-sm text-slate-500">
              Page {commentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={commentPage === totalPages}
              onClick={() => setCommentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}