type JournalPromptProps = {
  prompt: string;
};

export default function JournalPrompt({
  prompt,
}: JournalPromptProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
        Journal Prompt
      </p>

      <p className="mt-4 text-lg leading-8 text-white">
        {prompt}
      </p>

      <p className="mt-5 text-sm text-neutral-500">
        Reflect before writing →
      </p>
    </section>
  );
}