'use client'

import { motion, AnimatePresence } from 'framer-motion';
import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface ResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  date: string;
  content: string;
  tags: string[];
}

export const ResearchModal: React.FC<ResearchModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  date, 
  content, 
  tags 
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      modalRef.current?.focus();
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Recursive function to extract text content from React nodes
  const getTextContent = (node: React.ReactNode): string => {
    if (node === null || node === undefined) return '';
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(getTextContent).join('');
    if (
      React.isValidElement(node) &&
      typeof node.props === 'object' &&
      node.props !== null &&
      'children' in node.props
    ) {
      return getTextContent((node.props as { children?: React.ReactNode }).children);
    }
    return '';
  };

  // Custom CodeBlock component for ReactMarkdown
  const CodeBlock: React.FC<React.HTMLAttributes<HTMLElement>> = ({
    className,
    children,
    ...props
  }) => {
    const match = /language-(\w+)/.exec(className || '');
    const [isCopied, setIsCopied] = React.useState(false);

    const handleCopy = async () => {
      try {
        const textToCopy = getTextContent(children).replace(/\n$/, '');
        await navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    };

    return match ? (
      <div className="bg-gray-800 rounded-lg p-4 my-4 overflow-x-auto">
        <div className="flex justify-between items-center mb-2 text-gray-400 text-sm">
          <span>{match[1]}</span>
          <button 
            className="hover:text-white flex items-center gap-1"
            onClick={handleCopy}
          >
            {isCopied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
        <code className={`hljs language-${match[1]} block whitespace-pre`} {...props}>
          {children}
        </code>
      </div>
    ) : (
      <code className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-100" {...props}>
        {children}
      </code>
    );
  };

  // Custom components for ReactMarkdown
  const markdownComponents = {
    p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className="mb-4 text-lg leading-relaxed text-gray-100" {...props}>{props.children}</p>
    ),
    h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1 className="text-3xl font-bold text-white mt-8 mb-4" {...props}>{props.children}</h1>
    ),
    h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2 className="text-2xl font-bold text-white mt-6 mb-3" {...props}>{props.children}</h2>
    ),
    h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h3 className="text-xl font-bold text-white mt-5 mb-2" {...props}>{props.children}</h3>
    ),
    code: CodeBlock,
    a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a
        {...props}
        className={`text-blue-400 hover:text-blue-300 underline ${props.className ?? ''}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {props.children}
      </a>
    ),
    ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
      <ul className="list-disc pl-6 mb-4 text-gray-100" {...props}>{props.children}</ul>
    ),
    ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
      <ol className="list-decimal pl-6 mb-4 text-gray-100" {...props}>{props.children}</ol>
    ),
    li: (props: React.LiHTMLAttributes<HTMLLIElement>) => (
      <li className="mb-2 text-lg" {...props}>{props.children}</li>
    ),
    blockquote: (props: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-300 my-4" {...props}>
        {props.children}
      </blockquote>
    ),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          
          {/* Modal content */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-5xl rounded-2xl bg-gray-900 border border-white/10 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
          >
            <div className="p-8 w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 id="modal-title" className="text-3xl font-bold text-white">{title}</h2>
                <button
                  onClick={onClose}
                  className="text-white/70 hover:text-white transition p-1"
                  aria-label="Close modal"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center text-sm text-white/50 mb-6">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span className="text-lg">{date}</span>
              </div>
              
              <div className="markdown-content">
                <ReactMarkdown
                  rehypePlugins={[rehypeHighlight]}
                  components={markdownComponents}
                >
                  {content}
                </ReactMarkdown>
              </div>
              
              <div className="flex flex-wrap gap-3 mt-8">
                {tags.map((tag, index) => (
                  <span key={index} className="px-4 py-1.5 bg-blue-900/50 rounded-full text-blue-300 text-base">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="px-8 py-5 bg-gray-800/50 border-t border-white/10 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium text-lg transition"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};