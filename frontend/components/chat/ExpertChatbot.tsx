"use client";

import { useQuoteModal } from "@/components/quote/QuoteModalProvider";
import { quoteContextFromPathname } from "@/components/quote/quote-modal-utils";
import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useId, useRef, useState } from "react";

type Role = "bot" | "user";

type ChatMessage = {
  id: string;
  role: Role;
  text: string;
};

type ContactInfo = {
  name: string;
  email: string;
  phone: string;
};

const QUICK_REPLIES = [
  "Software licensing",
  "ELV & security",
  "Digital engineering",
  "Training & support",
] as const;

const WELCOME_TEXT =
  "Hi — I’m your Aptus assistant. Please share your name, email, and phone number so an expert can follow up, then tell me what you need.";

function botReply(input: string): string {
  const q = input.toLowerCase();
  if (/software|license|autodesk|adobe|oracle|microsoft|autocad/.test(q)) {
    return "Great — Aptus is an authorized partner for Autodesk, Adobe, Oracle, Microsoft and more. Tell me the product or team size, or open a quote request and our specialists will follow up.";
  }
  if (/elv|security|cctv|access|cabling|data center|networking/.test(q)) {
    return "We design and deliver ELV, security, structured cabling and smart infrastructure across Oman. Share your site type or challenge and we’ll connect you with the right expert.";
  }
  if (/engineer|bim|revit|civil|digital/.test(q)) {
    return "Our digital engineering team helps with BIM, design workflows and partner toolsets. What project phase are you in — design, coordination, or handover?";
  }
  if (/train|support|course|learn/.test(q)) {
    return "We offer product training and ongoing support so your team gets value from day one. Which solution should we focus on?";
  }
  if (/price|cost|quote|budget/.test(q)) {
    return "Happy to help with pricing. Use Request a Quote for a formal estimate, or leave your name and number here and an expert will call you back.";
  }
  if (/hello|hi|hey|salam/.test(q)) {
    return "Hello! How can Aptus Infotech help your business today — software, ELV/security, or a full technology solution?";
  }
  return "Thanks for sharing that. An Aptus expert can guide you on the right mix of technology and services. Would you like a callback, WhatsApp chat, or a formal quote request?";
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function ExpertChatbot({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const pathname = usePathname() ?? "/";
  const { openQuote } = useQuoteModal();
  const listRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [contact, setContact] = useState<ContactInfo>({
    name: "",
    email: "",
    phone: "",
  });
  const [contactError, setContactError] = useState("");
  const [contactCaptured, setContactCaptured] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "bot",
      text: WELCOME_TEXT,
    },
  ]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      if (!contactCaptured) {
        nameRef.current?.focus();
      } else {
        inputRef.current?.focus();
      }
    }, 120);
    return () => window.clearTimeout(t);
  }, [open, contactCaptured]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, contactCaptured, contactError]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const submitContact = (e: FormEvent) => {
    e.preventDefault();
    const name = contact.name.trim();
    const email = contact.email.trim();
    const phone = contact.phone.trim();

    if (!name || !email || !phone) {
      setContactError("Name, email, and phone number are required.");
      return;
    }
    if (!isValidEmail(email)) {
      setContactError("Please enter a valid email address.");
      return;
    }
    if (!isValidPhone(phone)) {
      setContactError("Please enter a valid phone number.");
      return;
    }

    setContactError("");
    setContactCaptured(true);
    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        role: "user",
        text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}`,
      },
      {
        id: uid(),
        role: "bot",
        text: `Thanks, ${name.split(/\s+/)[0] || name}! How can Aptus help today — software licensing, ELV & security, digital engineering, or something else?`,
      },
    ]);
  };

  const pushUser = (text: string) => {
    if (!contactCaptured) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "user", text: trimmed },
      { id: uid(), role: "bot", text: botReply(trimmed) },
    ]);
    setInput("");
  };

  if (!open) return null;

  return (
    <div className="aptus-expert-chat" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="aptus-expert-chat__panel">
        <header className="aptus-expert-chat__header">
          <div className="aptus-expert-chat__identity">
            <span className="aptus-expert-chat__avatar" aria-hidden="true">
              A
            </span>
            <div>
              <h2 id={titleId} className="aptus-expert-chat__title">
                Talk to an Expert
              </h2>
              <p className="aptus-expert-chat__status">Aptus Infotech · Online</p>
            </div>
          </div>
          <button
            type="button"
            className="aptus-expert-chat__close"
            onClick={onClose}
            aria-label="Close chat"
          >
            ×
          </button>
        </header>

        <div className="aptus-expert-chat__messages" ref={listRef}>
          {messages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === "bot"
                  ? "aptus-expert-chat__bubble aptus-expert-chat__bubble--bot"
                  : "aptus-expert-chat__bubble aptus-expert-chat__bubble--user"
              }
            >
              {m.text}
            </div>
          ))}

          {!contactCaptured ? (
            <form className="aptus-expert-chat__lead" onSubmit={submitContact} noValidate>
              <p className="aptus-expert-chat__lead-label">Your details</p>
              <label className="aptus-expert-chat__field">
                <span>Name *</span>
                <input
                  ref={nameRef}
                  type="text"
                  name="name"
                  autoComplete="name"
                  required
                  value={contact.name}
                  onChange={(e) => {
                    setContact((prev) => ({ ...prev, name: e.target.value }));
                    setContactError("");
                  }}
                  placeholder="Full name"
                />
              </label>
              <label className="aptus-expert-chat__field">
                <span>Email *</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={contact.email}
                  onChange={(e) => {
                    setContact((prev) => ({ ...prev, email: e.target.value }));
                    setContactError("");
                  }}
                  placeholder="name@company.com"
                />
              </label>
              <label className="aptus-expert-chat__field">
                <span>Phone number *</span>
                <input
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  required
                  value={contact.phone}
                  onChange={(e) => {
                    setContact((prev) => ({ ...prev, phone: e.target.value }));
                    setContactError("");
                  }}
                  placeholder="+968 …"
                />
              </label>
              {contactError ? (
                <p className="aptus-expert-chat__lead-error" role="alert">
                  {contactError}
                </p>
              ) : null}
              <button type="submit" className="aptus-expert-chat__lead-submit">
                Continue
              </button>
            </form>
          ) : null}
        </div>

        {contactCaptured ? (
          <>
            <div className="aptus-expert-chat__quick">
              {QUICK_REPLIES.map((label) => (
                <button
                  key={label}
                  type="button"
                  className="aptus-expert-chat__chip"
                  onClick={() => pushUser(label)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="aptus-expert-chat__actions">
              <a
                href="https://api.whatsapp.com/send?phone=96899418481"
                target="_blank"
                rel="noopener noreferrer"
                className="aptus-expert-chat__action"
              >
                WhatsApp
              </a>
              <button
                type="button"
                className="aptus-expert-chat__action aptus-expert-chat__action--primary"
                onClick={() => {
                  openQuote(quoteContextFromPathname(pathname));
                  onClose();
                }}
              >
                Request a Quote
              </button>
            </div>

            <form
              className="aptus-expert-chat__composer"
              onSubmit={(e) => {
                e.preventDefault();
                pushUser(input);
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your requirement…"
                className="aptus-expert-chat__input"
                aria-label="Message"
              />
              <button type="submit" className="aptus-expert-chat__send" aria-label="Send message">
                Send
              </button>
            </form>
          </>
        ) : (
          <p className="aptus-expert-chat__gate-hint">
            Enter your name, email, and phone to start chatting with an expert.
          </p>
        )}
      </div>
    </div>
  );
}
