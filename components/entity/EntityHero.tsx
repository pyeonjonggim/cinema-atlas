import BaseHero from "../layout/BaseHero";
import AtlasBadge from "../ui/AtlasBadge";
import AtlasTag from "../ui/AtlasTag";

type EntityHeroProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  description?: string;
  badges?: string[];
  tags?: string[];
};

export default function EntityHero({
  eyebrow,
  title,
  subtitle,
  description,
  badges = [],
  tags = [],
}: EntityHeroProps) {
  const meta = (
    <>
      {badges.map((badge) => (
        <AtlasBadge key={badge} label={badge} />
      ))}

      {tags.map((tag) => (
        <AtlasTag key={tag}>{tag}</AtlasTag>
      ))}
    </>
  );

  return (
    <BaseHero
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      description={description}
      meta={badges.length > 0 || tags.length > 0 ? meta : undefined}
    />
  );
}