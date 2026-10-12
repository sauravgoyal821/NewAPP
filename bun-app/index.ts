type Note = { id: number; text: string; createdAt: string };

const notes: Note[] = [];
let nextId = 1;

const server = Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  routes: {
    "/": new Response(
      `<!doctype html>
<html>
  <head><title>Bun App</title></head>
  <body style="font-family: sans-serif; max-width: 600px; margin: 40px auto;">
    <h1>Hello from Bun ${Bun.version}</h1>
    <form id="f">
      <input id="t" placeholder="Write a note" required />
      <button>Add</button>
    </form>
    <ul id="list"></ul>
    <script>
      async function load() {
        const notes = await (await fetch("/api/notes")).json();
        document.getElementById("list").innerHTML =
          notes.map(n => "<li>" + n.text + "</li>").join("");
      }
      document.getElementById("f").onsubmit = async (e) => {
        e.preventDefault();
        const t = document.getElementById("t");
        await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: t.value }),
        });
        t.value = "";
        load();
      };
      load();
    </script>
  </body>
</html>`,
      { headers: { "Content-Type": "text/html" } },
    ),

    "/api/health": () => Response.json({ status: "ok" }),

    "/api/notes": {
      GET: () => Response.json(notes),
      POST: async (req) => {
        const body = (await req.json().catch(() => null)) as { text?: string } | null;
        if (!body?.text?.trim()) {
          return Response.json({ error: "text is required" }, { status: 400 });
        }
        const note = { id: nextId++, text: body.text.trim(), createdAt: new Date().toISOString() };
        notes.push(note);
        return Response.json(note, { status: 201 });
      },
    },

    "/api/notes/:id": {
      DELETE: (req) => {
        const index = notes.findIndex((n) => n.id === Number(req.params.id));
        if (index === -1) return Response.json({ error: "not found" }, { status: 404 });
        notes.splice(index, 1);
        return new Response(null, { status: 204 });
      },
    },
  },
  fetch() {
    return Response.json({ error: "not found" }, { status: 404 });
  },
});

console.log(`Bun app running at ${server.url}`);
