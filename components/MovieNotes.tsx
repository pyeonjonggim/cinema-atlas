type MovieNotesProps = {
  atlasNote?: string;
  myNote?: string;
};

export default function MovieNotes({ atlasNote, myNote }: MovieNotesProps) {
  if (!atlasNote && !myNote) {
    return null;
  }

  return (
    <section className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
      <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">
        Notes
      </p>

      <h2 className="mt-2 text-3xl font-bold">📝 Notes</h2>

      {atlasNote && (
        <div className="mt-6 rounded-2xl bg-zinc-950 p-6">
          <p className="text-sm font-semibold text-zinc-500">📚 Atlas Note</p>
          <p className="mt-3 leading-7 text-zinc-300">{atlasNote}</p>
        </div>
      )}

      {myNote && (
        <div className="mt-4 rounded-2xl bg-zinc-950 p-6">
          <p className="text-sm font-semibold text-zinc-500">✍ My Note</p>
          <p className="mt-3 leading-7 text-zinc-300">{myNote}</p>
        </div>
      )}
    </section>
  );
}