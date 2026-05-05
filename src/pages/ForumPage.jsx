import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Plus } from "lucide-react";

import * as communityAPI from "@/api/communityApi";

export default function ForumPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [forums, setForums] = useState([]);
  const [selectedForumId, setSelectedForumId] = useState(null);

  const [newForumName, setNewForumName] = useState("");
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadContent, setNewThreadContent] = useState("");

  const [page, setPage] = useState(1);

  // ─── Load Forums ─────────────────────────────
  useEffect(() => {
  communityAPI.getForums().then((data) => {
    const forums = data.forums || [];
    setForums(forums);

    if (forums.length > 0) {
      setSelectedForumId(forums[0].id);
    }
  });
}, []);
  // ─── Load Threads (Paginated) ────────────────
  const {
    data,
    isLoading,
  } = useQuery({
    queryKey: ["threads", selectedForumId, page],
    queryFn: () => communityAPI.getThreads(selectedForumId, page),
    enabled: !!selectedForumId,
  });

  const threads = data?.threads || [];
 const totalPages = data?.pages || 1;;

  // ─── Create Forum ────────────────────────────
  const handleCreateForum = async () => {
    if (!newForumName.trim()) return;

    await communityAPI.createForum({
      name: newForumName,
      description: "",
      created_by: "test@example.com",
    });

    setNewForumName("");

    const updated = await communityAPI.getForums();
    setForums(updated);
  };

  // ─── Create Thread ───────────────────────────
  const handleCreateThread = async () => {
    if (!newThreadTitle.trim() || !newThreadContent.trim()) return;

    await communityAPI.createThread(selectedForumId, {
      title: newThreadTitle,
      content: newThreadContent,
      created_by: "test@example.com",
    });

    setNewThreadTitle("");
    setNewThreadContent("");

    queryClient.invalidateQueries(["threads", selectedForumId]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ─── SIDEBAR (FORUMS) ─── */}
      <div className="w-72 bg-white border-r p-4">
        <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-teal-500" />
          Forums
        </h2>

        {/* Create Forum */}
        <div className="flex gap-2 mb-4">
          <Input
            value={newForumName}
            onChange={(e) => setNewForumName(e.target.value)}
            placeholder="New forum"
          />
          <Button onClick={handleCreateForum}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Forum List */}
        <div className="space-y-2">
          {forums.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setSelectedForumId(f.id);
                setPage(1);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                selectedForumId === f.id
                  ? "bg-teal-500 text-white"
                  : "hover:bg-slate-100"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">

        {/* Create Thread */}
        {selectedForumId && (
          <div className="bg-white p-4 rounded-xl border mb-6">
            <Input
              placeholder="Thread title"
              value={newThreadTitle}
              onChange={(e) => setNewThreadTitle(e.target.value)}
              className="mb-2"
            />
            <Textarea
              placeholder="Start a discussion..."
              value={newThreadContent}
              onChange={(e) => setNewThreadContent(e.target.value)}
            />
            <div className="flex justify-end mt-2">
              <Button onClick={handleCreateThread}>
                Post
              </Button>
            </div>
          </div>
        )}

        {/* Threads */}
        {isLoading ? (
          <p>Loading...</p>
        ) : threads.length === 0 ? (
          <p className="text-slate-500 text-center">
            No threads yet
          </p>
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => (
              <div
                key={thread.id}
                className="bg-white p-4 rounded-xl border cursor-pointer hover:shadow"
                onClick={() => navigate(`/thread/${thread.id}`)}
              >
                <h3 className="font-semibold text-lg">
                  {thread.title}
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  {thread.content}
                </p>

                <div className="text-xs text-slate-400 mt-2">
                  by {thread.created_by}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Pagination ─── */}
        <div className="flex justify-center gap-2 mt-6">
          <Button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </Button>

          <span className="px-3 py-1 text-sm">
            Page {page} / {totalPages}
          </span>

          <Button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}