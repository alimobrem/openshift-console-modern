import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIntentStore } from '../../store/intentStore';
import { EXAMPLE_PROMPTS } from '../../engine/mockData/intentMocks';

export function IntentInput() {
  const draftInput = useIntentStore((s) => s.draftInput);
  const setDraftInput = useIntentStore((s) => s.setDraftInput);
  const submitIntent = useIntentStore((s) => s.submitIntent);
  const [focused, setFocused] = useState(false);

  const handleSubmit = () => {
    const trimmed = draftInput.trim();
    if (!trimmed) return;
    submitIntent(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'relative rounded-xl border bg-slate-900 transition-colors',
          focused ? 'border-violet-500/50' : 'border-slate-700'
        )}
      >
        <textarea
          value={draftInput}
          onChange={(e) => setDraftInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you want to achieve..."
          rows={3}
          className="w-full bg-transparent px-4 py-3 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none"
        />
        <div className="flex items-center justify-between px-3 pb-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            Natural language intent
          </div>
          <button
            onClick={handleSubmit}
            disabled={!draftInput.trim()}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              draftInput.trim()
                ? 'bg-violet-600 text-white hover:bg-violet-500'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            )}
          >
            <Send className="w-3.5 h-3.5" />
            Submit
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => setDraftInput(prompt)}
            className="rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1 text-xs text-slate-400 hover:border-violet-500/40 hover:text-violet-300 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
