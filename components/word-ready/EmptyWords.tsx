import { BookOpen } from "lucide-react";

import styles from "./EmptyWords.module.css";

export function EmptyWords() {
  return (
    <div className={styles.emptyWords}>
      <BookOpen aria-hidden="true" size={34} />
      <p>No words available.</p>
      <strong>Start by entering your words under “Class Words.”</strong>
    </div>
  );
}
