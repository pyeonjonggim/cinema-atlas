import EntityNavigation, {
  EntityNavigationItem,
} from "../navigation/EntityNavigation";

type ContinueJourneyPatternProps = {
  items: EntityNavigationItem[];
};

export default function ContinueJourneyPattern({
  items,
}: ContinueJourneyPatternProps) {
  return (
    <EntityNavigation
      title="Continue Your Journey"
      items={items}
    />
  );
}