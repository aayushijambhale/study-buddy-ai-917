import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, displayNameFor } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  FiArrowLeft,
  FiSend,
  FiHelpCircle,
  FiCopy,
  FiTrash2,
  FiMessageCircle,
  FiCheck,
} from "react-icons/fi";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rooms/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `Room ${params.code} — Accessible AI Study Buddy` },
      { name: "description", content: "Live collaborative study room." },
    ],
  }),
  component: RoomPage,
});

interface Room {
  id: string;
  code: string;
  name: string;
  pdf_name: string | null;
  created_by: string;
}

interface RoomMsg {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string;
  kind: "chat" | "question" | "answer";
  content: string;
  meta: { options?: string[]; answer?: string; questionId?: string } | null;
  reply_to: string | null;
  created_at: string;
}

function RoomPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const { session, loading, user } = useSession();
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<RoomMsg[]>([]);
  const [input, setInput] = useState("");
  const [posting, setPosting] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [answer, setAnswer] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const displayName = displayNameFor(user);

  useEffect(() => {
    if (!loading && !session)
      navigate({ to: "/auth", search: { redirect: `/rooms/${code}` } as never, replace: true });
  }, [loading, session, navigate, code]);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data: r } = await supabase
        .from("study_rooms")
        .select("*")
        .eq("code", code)
        .maybeSingle();
      if (!r) {
        toast.error("Room not found");
        navigate({ to: "/rooms" });
        return;
      }
      setRoom(r as Room);
      const { data: msgs } = await supabase
        .from("room_messages")
        .select("*")
        .eq("room_id", (r as Room).id)
        .order("created_at", { ascending: true })
        .limit(500);
      setMessages((msgs as RoomMsg[]) ?? []);
    })();
  }, [code, session, navigate]);

  // Realtime
  useEffect(() => {
    if (!room) return;
    const channel = supabase
      .channel(`room-${room.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${room.id}` },
        (payload) => {
          setMessages((prev) => {
            const msg = payload.new as RoomMsg;
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "room_messages", filter: `room_id=eq.${room.id}` },
        (payload) => {
          const old = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== old.id));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [room]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room || !user || !input.trim()) return;
    setPosting(true);
    try {
      const { error } = await supabase.from("room_messages").insert({
        room_id: room.id,
        user_id: user.id,
        display_name: displayName,
        kind: "chat",
        content: input.trim(),
      });
      if (error) throw error;
      setInput("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setPosting(false);
    }
  };

  const postQuestion = async () => {
    if (!room || !user || !question.trim()) return;
    const filled = options.map((o) => o.trim()).filter(Boolean);
    if (filled.length < 2 || !answer.trim() || !filled.includes(answer.trim())) {
      toast.error("Enter at least 2 options and pick the correct one.");
      return;
    }
    const { error } = await supabase.from("room_messages").insert({
      room_id: room.id,
      user_id: user.id,
      display_name: displayName,
      kind: "question",
      content: question.trim(),
      meta: { options: filled, answer: answer.trim() },
    });
    if (error) return toast.error(error.message);
    setQuestion("");
    setOptions(["", "", "", ""]);
    setAnswer("");
    setShowQuestion(false);
  };

  const submitAnswer = async (q: RoomMsg, chosen: string) => {
    if (!room || !user) return;
    const isCorrect = chosen === q.meta?.answer;
    await supabase.from("room_messages").insert({
      room_id: room.id,
      user_id: user.id,
      display_name: displayName,
      kind: "answer",
      content: chosen,
      meta: { questionId: q.id, answer: q.meta?.answer },
      reply_to: q.id,
    });
    if (isCorrect) toast.success("Correct!");
    else toast.error(`Wrong. Answer: ${q.meta?.answer}`);
  };

  const deleteMsg = async (m: RoomMsg) => {
    if (!user || m.user_id !== user.id) return;
    await supabase.from("room_messages").delete().eq("id", m.id);
  };

  const copyCode = () => {
    if (!room) return;
    const url = `${window.location.origin}/rooms/${room.code}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied");
  };

  const answersByQuestion = useMemo(() => {
    const map: Record<string, RoomMsg[]> = {};
    for (const m of messages) {
      if (m.kind === "answer" && m.reply_to) {
        (map[m.reply_to] ||= []).push(m);
      }
    }
    return map;
  }, [messages]);

  const myAnswerFor = (qid: string) =>
    answersByQuestion[qid]?.find((a) => a.user_id === user?.id);

  if (loading || !session || !room)
    return <div className="min-h-dvh grid place-items-center text-muted-foreground">Loading room…</div>;

  return (
    <div className="min-h-dvh bg-gradient-soft flex flex-col">
      <header className="border-b bg-card/60 backdrop-blur">
        <div className="max-w-4xl mx-auto p-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/rooms"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Back"
            >
              <FiArrowLeft />
            </Link>
            <div className="min-w-0">
              <div className="font-semibold truncate">{room.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {room.pdf_name ? `📄 ${room.pdf_name} · ` : ""}
                <span className="font-mono">{room.code}</span>
              </div>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={copyCode}>
            <FiCopy className="mr-1" /> Invite
          </Button>
        </div>
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-16">
              No messages yet. Say hi or post a quiz question below.
            </div>
          )}
          {messages
            .filter((m) => m.kind !== "answer")
            .map((m) => {
              const mine = m.user_id === user?.id;
              if (m.kind === "question") {
                const my = myAnswerFor(m.id);
                const allAnswers = answersByQuestion[m.id] ?? [];
                return (
                  <div key={m.id} className="glass rounded-2xl p-4 border border-primary/20">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span className="font-semibold text-primary flex items-center gap-1">
                        <FiHelpCircle /> {m.display_name} asked
                      </span>
                      <span>{new Date(m.created_at).toLocaleTimeString()}</span>
                    </div>
                    <div className="font-medium mb-3">{m.content}</div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {m.meta?.options?.map((opt) => {
                        const chosen = my?.content === opt;
                        const revealed = !!my;
                        const isCorrect = opt === m.meta?.answer;
                        return (
                          <button
                            key={opt}
                            disabled={!!my}
                            onClick={() => submitAnswer(m, opt)}
                            className={cn(
                              "text-left rounded-xl border px-3 py-2 text-sm transition-colors",
                              revealed && isCorrect && "border-accent bg-accent/15",
                              revealed && chosen && !isCorrect && "border-destructive bg-destructive/10",
                              !revealed && "hover:bg-muted",
                            )}
                          >
                            {opt}
                            {revealed && isCorrect && <FiCheck className="inline ml-2 text-accent" />}
                          </button>
                        );
                      })}
                    </div>
                    {allAnswers.length > 0 && (
                      <div className="mt-3 text-xs text-muted-foreground">
                        {allAnswers.length} answered ·{" "}
                        {allAnswers.filter((a) => a.content === m.meta?.answer).length} correct
                      </div>
                    )}
                    {mine && (
                      <button
                        onClick={() => deleteMsg(m)}
                        className="mt-2 text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
                      >
                        <FiTrash2 /> Delete
                      </button>
                    )}
                  </div>
                );
              }
              return (
                <div
                  key={m.id}
                  className={cn("flex", mine ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                      mine
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border",
                    )}
                  >
                    <div className={cn("text-[10px] mb-0.5", mine ? "opacity-80" : "text-muted-foreground")}>
                      {m.display_name} · {new Date(m.created_at).toLocaleTimeString()}
                    </div>
                    <div className="whitespace-pre-wrap break-words">{m.content}</div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <div className="border-t bg-card/60 backdrop-blur">
        <div className="max-w-4xl mx-auto p-4 space-y-3">
          {showQuestion && (
            <div className="glass rounded-2xl p-4 space-y-2">
              <div className="font-semibold text-sm">Post a quiz question</div>
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Question…"
              />
              <div className="grid grid-cols-2 gap-2">
                {options.map((o, i) => (
                  <Input
                    key={i}
                    value={o}
                    onChange={(e) =>
                      setOptions((arr) => arr.map((v, j) => (j === i ? e.target.value : v)))
                    }
                    placeholder={`Option ${i + 1}`}
                  />
                ))}
              </div>
              <Input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Correct answer (copy one of the options exactly)"
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => setShowQuestion(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={postQuestion}>
                  Post question
                </Button>
              </div>
            </div>
          )}

          <form onSubmit={send} className="flex gap-2 items-center">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowQuestion((s) => !s)}
              aria-label="Post a quiz question"
            >
              <FiHelpCircle />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message the room…"
              aria-label="Message"
            />
            <Button type="submit" disabled={posting || !input.trim()}>
              <FiSend />
            </Button>
          </form>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
            <FiMessageCircle /> Signed in as {displayName}
          </div>
        </div>
      </div>
    </div>
  );
}
