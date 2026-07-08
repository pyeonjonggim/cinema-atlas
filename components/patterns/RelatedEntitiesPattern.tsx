import EntityRelationList, {
  EntityRelationItem,
} from "../entity/EntityRelationList";

type RelatedEntitiesPatternProps = {
  title: string;
  items: EntityRelationItem[];
};

export default function RelatedEntitiesPattern({
  title,
  items,
}: RelatedEntitiesPatternProps) {
  return (
    <EntityRelationList
      title={title}
      items={items}
      emptyMessage="No related entities available."
    />
  );
}