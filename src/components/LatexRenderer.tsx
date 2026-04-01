'use client';

import { useEffect, useRef } from 'react';
import katex from 'katex';

/**
 * LaTeX 渲染组件
 * 支持 $...$ 行内公式和 $$...$$ 行间公式
 */
export function LatexRenderer({ content }: { content: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    let html = content;

    // 先处理行间公式 $$...$$
    html = html.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
      try {
        return `<div class="katex-block my-4 text-center">${katex.renderToString(formula.trim(), {
          displayMode: true,
          throwOnError: false
        })}</div>`;
      } catch {
        return match;
      }
    });

    // 再处理行内公式 $...$
    html = html.replace(/\$([^$]+)\$/g, (match, formula) => {
      try {
        return katex.renderToString(formula.trim(), {
          displayMode: false,
          throwOnError: false
        });
      } catch {
        return match;
      }
    });

    containerRef.current.innerHTML = html;
  }, [content]);

  return (
    <div
      ref={containerRef}
      className="latex-content"
      style={{ wordBreak: 'break-word' }}
    />
  );
}

/**
 * 纯文本渲染（无 LaTeX）
 * 用于不需要公式渲染的地方
 */
export function PlainTextRenderer({ content }: { content: string }) {
  return <>{content}</>;
}