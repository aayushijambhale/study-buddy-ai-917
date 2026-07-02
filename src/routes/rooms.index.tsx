import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, displayNameFor } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FiUsers, FiPlus, FiLogIn, FiArrowLeft, FiLogOut } from "react-icons/fi";

export const Route = createFileRoute("/rooms/")({
  head: () => ({
    meta: [
      { title: "Study Rooms — Accessible AI Study Buddy" },
      {
        name: "description",
        content: "Create or join a collaborative study room to quiz your group in real time.",
      },
    ],
  }),
  component: RoomsIndex,
});

interface Room {
  id: string;
  code: string;
  name: string;
  pdf_name: string | null;
  created_at: string;
  created_by: string;
}

function RoomsIndex() {
  const { session, loading, user } = useSession();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomName, setRoomName] = useState("");
  const [pdfName, setPdfName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", search: { redirect: "/rooms" } as never, replace: true });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("study_rooms")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => setRooms((data as Room[]) ?? []));
  }, [session]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);
    try {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      const { data, error } = await supabase
        .from("study_rooms")
        .insert({
          code,
          name: roomName || "Untitled room",
          pdf_name: pdfName || null,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      toast.success(`Room created — code ${code}`);
      navigate({ to: "/rooms/$code", params: { code: (data as Room).code } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create room");
    } finally {
      setCreating(false);
    }
  };

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    const { data } = await supabase
      .from("study_rooms")
      .select("code")
      .eq("code", code)
      .maybeSingle();
    if (!data) {
      toast.error("Room not found");
      return;
    }
    navigate({ to: "/rooms/$code", params: { code } });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  if (loading || !session)
    return <div className="min-h-dvh grid place-items-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-dvh bg-gradient-soft p-5 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/app"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <FiArrowLeft /> Back to workspace
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{displayNameFor(user)}</span>
            <Button size="sm" variant="outline" onClick={signOut}>
              <FiLogOut className="mr-1" /> Sign out
            </Button>
          </div>
        </div>

        <header>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FiUsers /> Study Rooms
          </h1>
          <p className="text-muted-foreground mt-1">
            Create a room, share the code, and quiz each other in real time.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-4">
          <form onSubmit={create} className="glass rounded-2xl p-6 space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <FiPlus /> Create a room
            </h2>
            <div>
              <Label htmlFor="rname">Room name</Label>
              <Input
                id="rname"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Biology midterm study"
                required
              />
            </div>
            <div>
              <Label htmlFor="rpdf">PDF name (optional)</Label>
              <Input
                id="rpdf"
                value={pdfName}
                onChange={(e) => setPdfName(e.target.value)}
                placeholder="Chapter 7 — Genetics"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Each member uploads their own copy of the same PDF into the workspace.
              </p>
            </div>
            <Button type="submit" disabled={creating} className="w-full">
              {creating ? "Creating…" : "Create room"}
            </Button>
          </form>

          <form onSubmit={join} className="glass rounded-2xl p-6 space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <FiLogIn /> Join a room
            </h2>
            <div>
              <Label htmlFor="code">Room code</Label>
              <Input
                id="code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={12}
                className="tracking-widest uppercase"
              />
            </div>
            <Button type="submit" className="w-full">
              Join room
            </Button>
          </form>
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="font-semibold mb-3">Recent rooms</h2>
          {rooms.length === 0 ? (
            <div className="text-sm text-muted-foreground">No rooms yet — create the first one.</div>
          ) : (
            <ul className="divide-y">
              {rooms.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Code <span className="font-mono">{r.code}</span>
                      {r.pdf_name ? ` · ${r.pdf_name}` : ""}
                    </div>
                  </div>
                  <Link
                    to="/rooms/$code"
                    params={{ code: r.code }}
                    className="text-sm text-primary hover:underline"
                  >
                    Open →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
