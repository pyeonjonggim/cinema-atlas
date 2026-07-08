import AtlasBadge from "../ui/AtlasBadge";
import AtlasCard from "../ui/AtlasCard";

type EntityCardProps = {
  href: string;
  label: string;
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
};

export default function EntityCard({
  href,
  label,
  title,
  subtitle,
  description,
  badge,
}: EntityCardProps) {
  return (
    <AtlasCard href={href}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">{label}</p>

          <h3 className="mt-3 text-2xl font-bold text-white">{title}</h3>

          {subtitle && <p className="mt-1 text-neutral-500">{subtitle}</p>}
        </div>

        {badge && <AtlasBadge label={badge} />}
      </div>

      {description && (
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-neutral-400">
          {description}
        </p>
      )}

      <p className="mt-6 text-sm font-semibold text-neutral-300">
        Explore →
      </p>
    </AtlasCard>
  );
}