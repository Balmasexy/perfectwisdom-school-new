import { Sparkles } from "lucide-react";

export default function BalmzAI({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <div className={`balmz-ai ${compact ? "balmz-ai-compact" : ""}`}>
      <div className="balmz-ai-icon">
        <Sparkles size={compact ? 17 : 21} />
      </div>

      <div>
        <strong>BALMZ AI</strong>
        {!compact && (
          <span>
            Your intelligent Perfect Wisdom School assistant
          </span>
        )}
      </div>
    </div>
  );
}
