import { BookOpen } from "lucide-react";

type EmptyWordsProps = {
  onUseSampleWords: () => void;
};

export function EmptyWords({ onUseSampleWords }: EmptyWordsProps) {
  return (
    <div className="empty-words">
      <BookOpen aria-hidden="true" size={34} />
      <p>No words available.</p>
      <strong>Start by entering your words under “Class Words.”</strong>
      <button onClick={onUseSampleWords} type="button">
        Use sample words
      </button>
    </div>
  );
}
