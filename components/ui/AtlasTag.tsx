type AtlasTagProps = {
  children: string;
};

export default function AtlasTag({ children }: AtlasTagProps) {
  return (
    <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-neutral-300">
      {children}
    </span>
  );
}