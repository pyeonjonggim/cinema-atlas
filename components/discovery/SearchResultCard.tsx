import EntityCard from "../entity/EntityCard";

type SearchResultCardProps = {
  href: string;
  type: string;
  title: string;
  subtitle?: string;
  description?: string;
};

export default function SearchResultCard({
  href,
  type,
  title,
  subtitle,
  description,
}: SearchResultCardProps) {
  return (
    <EntityCard
      href={href}
      label={type}
      title={title}
      subtitle={subtitle}
      description={description}
    />
  );
}