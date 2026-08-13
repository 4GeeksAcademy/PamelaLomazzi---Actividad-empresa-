export type IncidentMetricsResponse = {
  total_processed: number;
  total_valid: number;
  total_invalid: number;
  invalid_reason_counts: Record<string, number>;
  category_counts: Record<string, number>;
  status_counts: Record<string, number>;
  avg_closed_satisfaction: number | null;
  closed_scores_count: number;
};
