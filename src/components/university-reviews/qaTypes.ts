
export type UniversityQuestion = {
  id: number;
  university: string;
  author: string;
  question: string;
  createdAt: string;
  replies: UniversityReply[];
};

export type UniversityReply = {
  id: number;
  author: string;
  reply: string;
  createdAt: string;
};
