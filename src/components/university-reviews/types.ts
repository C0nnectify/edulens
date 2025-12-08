
export type Review = {
  id: number;
  university: string;
  subject?: string;
  department?: string;
  reviewer: string;
  rating: number;
  comment: string;
};
