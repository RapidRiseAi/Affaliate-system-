'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Eraser, LoaderCircle, PenLine } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Point = { x: number; y: number };
type Stroke = Point[];

function pointFromEvent(canvas: HTMLCanvasElement, event: React.PointerEvent) {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)),
    y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)),
  };
}

function renderStrokes(canvas: HTMLCanvasElement, strokes: Stroke[]) {
  const scale = window.devicePixelRatio || 1;
  const bounds = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(bounds.width * scale));
  canvas.height = Math.max(1, Math.round(bounds.height * scale));
  const context = canvas.getContext('2d');
  if (!context) return;
  context.scale(scale, scale);
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = 2.4;
  context.strokeStyle = '#e7f8ff';
  for (const stroke of strokes) {
    if (!stroke.length) continue;
    context.beginPath();
    context.moveTo(stroke[0].x * bounds.width, stroke[0].y * bounds.height);
    for (const point of stroke.slice(1)) {
      context.lineTo(point.x * bounds.width, point.y * bounds.height);
    }
    context.stroke();
  }
}

export function SignaturePad({ agreementId }: { agreementId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const [signerName, setSignerName] = useState('');
  const [consent, setConsent] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => renderStrokes(canvas, strokesRef.current);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const redraw = () => {
    if (canvasRef.current) renderStrokes(canvasRef.current, strokesRef.current);
  };

  const clear = () => {
    strokesRef.current = [];
    activeStrokeRef.current = null;
    setHasInk(false);
    setError('');
    redraw();
  };

  const pointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (pending) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const stroke = [pointFromEvent(event.currentTarget, event)];
    strokesRef.current = [...strokesRef.current, stroke];
    activeStrokeRef.current = stroke;
    setHasInk(true);
    redraw();
  };

  const pointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activeStrokeRef.current || pending) return;
    const point = pointFromEvent(event.currentTarget, event);
    const previous = activeStrokeRef.current.at(-1);
    if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < 0.002) return;
    activeStrokeRef.current.push(point);
    redraw();
  };

  const pointerUp = () => {
    const stroke = activeStrokeRef.current;
    if (stroke?.length === 1) stroke.push({ ...stroke[0], x: Math.min(1, stroke[0].x + 0.001) });
    activeStrokeRef.current = null;
    redraw();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    if (!signerName.trim() || !consent || !hasInk) {
      setError('Enter your legal name, draw your signature, and accept the electronic-signature consent.');
      return;
    }
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/affiliate/agreements/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreement_id: agreementId,
          signer_name: signerName.trim(),
          consent,
          signature_strokes: strokesRef.current,
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'The agreement could not be signed.');
      setComplete(true);
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'The agreement could not be signed.');
    } finally {
      setPending(false);
    }
  };

  if (complete) {
    return <div role="status" className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] p-5 text-emerald-100"><CheckCircle2 aria-hidden className="mt-0.5 text-emerald-300" /><div><p className="font-black">Agreement signed</p><p className="mt-1 text-sm">Your signature evidence and the exact agreement snapshot have been saved.</p></div></div>;
  }

  return <form onSubmit={submit} className="mt-6 grid gap-5 border-t border-white/10 pt-6">
    <div>
      <label htmlFor="signer-name" className="text-sm font-bold text-slate-200">Full legal name</label>
      <input id="signer-name" className="input mt-2" value={signerName} onChange={(event) => setSignerName(event.target.value)} autoComplete="name" minLength={2} maxLength={200} disabled={pending} required />
    </div>
    <div>
      <div className="mb-2 flex items-center justify-between gap-3"><label className="text-sm font-bold text-slate-200" htmlFor="signature-canvas">Draw your signature</label><button type="button" className="btn btn-muted min-h-9 px-3 py-1 text-xs" onClick={clear} disabled={pending || !hasInk}><Eraser aria-hidden size={15} />Clear</button></div>
      <canvas id="signature-canvas" ref={canvasRef} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} className="h-48 w-full touch-none rounded-2xl border border-cyan-300/25 bg-slate-950/70 shadow-inner" aria-label="Electronic signature drawing area" />
      <p className="mt-2 text-xs text-slate-500">Use a mouse, trackpad, stylus, or finger.</p>
    </div>
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-sm leading-6 text-slate-300"><input type="checkbox" className="mt-1 h-4 w-4 accent-cyan-400" checked={consent} onChange={(event) => setConsent(event.target.checked)} disabled={pending} required /><span>I have reviewed this agreement, consent to use an electronic signature, and intend this signature to have the same legal effect as my handwritten signature.</span></label>
    {error ? <p role="alert" className="rounded-xl border border-red-300/25 bg-red-300/[0.08] px-4 py-3 text-sm text-red-100">{error}</p> : null}
    <button type="submit" className="btn btn-primary min-h-12 w-full disabled:cursor-wait disabled:opacity-65" disabled={pending || !signerName.trim() || !consent || !hasInk} aria-busy={pending}>{pending ? <LoaderCircle className="animate-spin" aria-hidden size={18} /> : <PenLine aria-hidden size={18} />}{pending ? 'Securing your signature…' : 'Sign and activate agreement'}</button>
  </form>;
}
