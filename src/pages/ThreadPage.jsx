import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as communityAPI from "@/api/communityApi";

export default function ThreadPage() {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["thread", id],
    queryFn: () => communityAPI.getThread(id),
  });

  if (isLoading) return <p>Loading...</p>;

  const { thread, comments } = data;

  return (
    <div className="max-w-3xl mx-auto p-6">

      <h1 className="text-2xl font-bold">{thread.title}</h1>
      <p className="mt-2 text-slate-600">{thread.content}</p>

      <hr className="my-4" />

      <h2 className="font-semibold mb-2">Comments</h2>

      {comments.map((c) => (
        <div key={c.id} className="border p-3 rounded mb-2">
          {c.content}
        </div>
      ))}
    </div>
  );
}