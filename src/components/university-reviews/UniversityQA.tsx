
import React, { useState, useMemo } from "react";
import { UniversityQuestion, UniversityReply } from "./qaTypes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  university: string;
};

const initialQuestions: UniversityQuestion[] = [
  {
    id: 1,
    university: "Stanford University",
    author: "Jess",
    question: "How difficult are the first-year CS classes?",
    createdAt: new Date().toISOString(),
    replies: [
      {
        id: 1,
        author: "Alice",
        reply: "They're challenging but professors are supportive. Study groups really help!",
        createdAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 2,
    university: "MIT",
    author: "Sam",
    question: "What's the campus culture like?",
    createdAt: new Date().toISOString(),
    replies: []
  }
];

export default function UniversityQA({ university }: Props) {
  const [questions, setQuestions] = useState<UniversityQuestion[]>(initialQuestions);
  const [questionText, setQuestionText] = useState("");
  const [author, setAuthor] = useState("");
  const [replyInputs, setReplyInputs] = useState<Record<number, { text: string; author: string }>>({});
  const [submitting, setSubmitting] = useState(false);

  // Filter questions for current university
  const uniQuestions = useMemo(
    () => questions.filter(q => q.university === university),
    [questions, university]
  );

  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || !author.trim()) return;
    setSubmitting(true);
    const newQuestion: UniversityQuestion = {
      id: questions.length ? Math.max(...questions.map(q => q.id)) + 1 : 1,
      university,
      author: author.trim(),
      question: questionText.trim(),
      createdAt: new Date().toISOString(),
      replies: []
    };
    setQuestions([newQuestion, ...questions]);
    setQuestionText("");
    setAuthor("");
    setTimeout(() => setSubmitting(false), 400);
  };

  const handleReplyInputChange = (id: number, key: "text" | "author", value: string) => {
    setReplyInputs(inputs => ({
      ...inputs,
      [id]: { ...inputs[id], [key]: value }
    }));
  };

  const handleReplySubmit = (qid: number, e: React.FormEvent) => {
    e.preventDefault();
    const replyInput = replyInputs[qid];
    if (!replyInput || !replyInput.text.trim() || !replyInput.author.trim()) return;
    setQuestions(questions =>
      questions.map(q =>
        q.id === qid
          ? {
              ...q,
              replies: [
                ...q.replies,
                {
                  id: q.replies.length ? Math.max(...q.replies.map(r => r.id)) + 1 : 1,
                  reply: replyInput.text.trim(),
                  author: replyInput.author.trim(),
                  createdAt: new Date().toISOString()
                }
              ]
            }
          : q
      )
    );
    setReplyInputs(inputs => ({ ...inputs, [qid]: { text: "", author: "" } }));
  };

  return (
    <div className="mb-12 mt-12">
      <h2 className="text-xl font-semibold mb-2 text-emerald-800">Q&amp;A / Discussion</h2>
      <form onSubmit={handleQuestionSubmit} className="flex flex-col md:flex-row gap-2 mb-6">
        <Input
          className="md:max-w-[180px]"
          placeholder="Your name"
          value={author}
          onChange={e => setAuthor(e.target.value)}
          disabled={submitting}
        />
        <Input
          className="flex-1"
          placeholder={`Ask a question about ${university}`}
          value={questionText}
          onChange={e => setQuestionText(e.target.value)}
          disabled={submitting}
        />
        <Button type="submit" disabled={submitting || !questionText.trim() || !author.trim()}>Ask</Button>
      </form>
      {uniQuestions.length === 0 ? (
        <div className="text-gray-500">No questions yet. Be the first to ask!</div>
      ) : (
        <div className="space-y-6">
          {uniQuestions.map(question => (
            <div key={question.id} className="border p-4 rounded-lg bg-emerald-50">
              <div className="mb-1 font-medium text-emerald-900">
                Q: {question.question}
              </div>
              <div className="text-xs text-gray-500 mb-2">by {question.author} • {new Date(question.createdAt).toLocaleString()}</div>
              <div className="ml-4">
                {question.replies.length === 0 ? (
                  <div className="text-sm text-gray-400 mb-2">No replies yet.</div>
                ) : (
                  <ul className="mb-2 space-y-1">
                    {question.replies.map(reply => (
                      <li key={reply.id} className="text-gray-800 text-sm rounded pl-3 border-l-2 border-emerald-200">
                        <div>{reply.reply}</div>
                        <div className="text-xs text-gray-400">by {reply.author} • {new Date(reply.createdAt).toLocaleString()}</div>
                      </li>
                    ))}
                  </ul>
                )}
                <form
                  className="flex flex-col md:flex-row gap-2 mt-1"
                  onSubmit={e => handleReplySubmit(question.id, e)}
                >
                  <Input
                    className="md:max-w-[150px]"
                    placeholder="Your name"
                    value={replyInputs[question.id]?.author || ""}
                    onChange={e => handleReplyInputChange(question.id, "author", e.target.value)}
                  />
                  <Input
                    className="flex-1"
                    placeholder="Write a reply"
                    value={replyInputs[question.id]?.text || ""}
                    onChange={e => handleReplyInputChange(question.id, "text", e.target.value)}
                  />
                  <Button type="submit" size="sm">Reply</Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
