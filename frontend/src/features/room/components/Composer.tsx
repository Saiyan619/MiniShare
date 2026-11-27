import { useRef, useState, type KeyboardEvent } from 'react'
import { Clipboard, LoaderCircle, Send } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Textarea } from '../../../components/ui/textarea'
import { Button } from '../../../components/ui/button'
import { canPasteFromClipboard, readClipboardText } from '../../../lib/clipboard'
import { sendMessage } from '../../../lib/api'

interface ComposerProps {
  roomId: string
  token: string
}

export function Composer({ roomId, token }: ComposerProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const queryClient = useQueryClient()

  const sendMutation = useMutation({
    mutationFn: (value: string) => sendMessage(roomId, token, value),
    onSuccess: () => {
      setText('')
      void queryClient.invalidateQueries({ queryKey: ['messages', roomId] })
    },
    onError: () => {
      toast.error('Could not send. Your text is still here.')
    },
  })

  function submit() {
    if (!text.trim() || sendMutation.isPending) return
    sendMutation.mutate(text)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      submit()
    }
  }

  function promptManualPaste() {
    textareaRef.current?.focus()
    toast('Clipboard access is blocked here. Long-press the text box, or press Ctrl+V (⌘V on Mac), to paste.')
  }

  async function handlePaste() {
    // Browsers only expose navigator.clipboard in a secure context, so this has
    // to fall back to the user pasting into the focused textarea by hand.
    if (!canPasteFromClipboard()) {
      promptManualPaste()
      return
    }
    try {
      const clipboardText = await readClipboardText()
      if (!clipboardText) {
        toast('Your clipboard is empty')
        return
      }
      setText((current) => `${current}${clipboardText}`.slice(0, 10000))
    } catch {
      promptManualPaste()
    }
  }

  return (
    <section
      className="sticky bottom-0 z-10 rounded-t-[36px] bg-accent-fill px-4 pt-4 md:px-5 md:pt-5"
      style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto max-w-[1180px]">
        <Textarea
          ref={textareaRef}
          aria-label="Message text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={10000}
          disabled={sendMutation.isPending}
          placeholder="Paste or type text..."
          className="min-h-[104px] resize-none rounded-[28px] border-0 bg-surface px-5 py-5 text-[16px] leading-[1.45] text-ink shadow-none md:min-h-[92px] md:text-[16px]"
        />
        <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-3 md:grid-cols-[auto_1fr_auto]">
          <Button
            type="button"
            variant="outline"
            className="h-[52px] rounded-[18px] border-0 bg-surface px-5 text-[17px] font-bold text-ink"
            onClick={handlePaste}
            disabled={sendMutation.isPending}
          >
            <Clipboard className="mr-2 size-5" />
            Paste
          </Button>
          <span className="justify-self-end text-[15px] text-accent-ink md:justify-self-center md:text-[16px]">
            {text.length.toLocaleString()} / 10,000
          </span>
          <Button
            type="button"
            className="h-[52px] rounded-[18px] px-5 text-[17px] font-bold md:min-w-[130px]"
            disabled={!text.trim() || sendMutation.isPending}
            onClick={submit}
          >
            {sendMutation.isPending ? (
              <>
                <LoaderCircle className="mr-2 size-5 motion-safe:animate-spin" />
                Sending…
              </>
            ) : (
              <>
                Send
                <Send className="ml-2 size-5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  )
}
