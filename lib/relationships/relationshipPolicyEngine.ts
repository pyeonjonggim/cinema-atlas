import { relationshipRegistry } from "@/lib/relationships/relationshipRegistry";
import {
  relationshipGroupRegistry,
  relationshipPolicyRegistry,
} from "@/lib/relationships/relationshipPolicyRegistry";
import type {
  RelationshipCategory,
  RelationshipGrouping,
  RelationshipPolicy,
  RelationshipPriority,
} from "@/types/relationshipPolicy";

const policiesByType = new Map(
  relationshipPolicyRegistry.map((policy) => [policy.relationshipType, policy]),
);

export class RelationshipPolicyEngine {
  getPolicy(relationshipType: string): RelationshipPolicy | undefined {
    return policiesByType.get(relationshipType);
  }

  getPolicies(): RelationshipPolicy[] {
    return relationshipRegistry
      .map((definition) => policiesByType.get(definition.key))
      .filter((policy): policy is RelationshipPolicy => Boolean(policy));
  }

  isVisible(relationshipType: string): boolean {
    const policy = this.getPolicy(relationshipType);
    return policy?.visibility === "visible" && policy.visibleByDefault;
  }

  getPriority(relationshipType: string): RelationshipPriority {
    return this.getPolicy(relationshipType)?.priority ?? Number.MAX_SAFE_INTEGER;
  }

  getCategory(relationshipType: string): RelationshipCategory {
    return this.getPolicy(relationshipType)?.category ?? "CONTEXT";
  }

  getGroup(relationshipType: string): RelationshipGrouping {
    return this.getPolicy(relationshipType)?.group ?? "HISTORICAL_CONTEXT";
  }

  getGroupDefinition(group: RelationshipGrouping) {
    return relationshipGroupRegistry.find((definition) => definition.group === group);
  }

  getGroupDefinitions() {
    return [...relationshipGroupRegistry];
  }
}
