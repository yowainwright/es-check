export interface Feature {
  title: string;
  description: string;
  slug: string;
}

export interface FeatureCardProps {
  feature: Feature;
  index: number;
  isVisible: boolean;
}
