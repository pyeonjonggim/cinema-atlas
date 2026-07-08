import EntityCard from "../entity/EntityCard";

type RecommendationCardProps = {
  href: string;
  title: string;
  reason: string;
  type: string;
};

export default function RecommendationCard({
  href,
  title,
  reason,
  type,
}: RecommendationCardProps) {
  return (
    <EntityCard
      href={href}
      label={type}
      title={title}
      description={reason}
      badge="Recommended"
    />
  );
}