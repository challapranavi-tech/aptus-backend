"use client";

import { useQuoteModal } from "@/components/quote/QuoteModalProvider";
import {
  quoteContextForFamily,
  quoteContextFromPathname,
  type QuoteModalContext,
} from "@/components/quote/quote-modal-utils";
import { normalizePhone } from "@/lib/phone";
import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";

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

type InterestOption = {
  label: string;
  family: string;
  intro: string;
};

const INTEREST_OPTIONS: InterestOption[] = [
  {
    label: "Software licensing",
    family: "software-licensing",
    intro:
      "Here are our software products. Pick one to request a quote, or tell me which product you need.",
  },
  {
    label: "ELV & security",
    family: "elv",
    intro:
      "Here are our ELV & security solutions. Pick one to request a quote, or describe your site needs.",
  },
  {
    label: "Digital engineering",
    family: "autodesk",
    intro:
      "Here are digital engineering / Autodesk tools we support. Pick one to request a quote.",
  },
  {
    label: "Training & support",
    family: "educational",
    intro:
      "Here are training-focused products we support. Pick one, or tell us which team needs enablement.",
  },
];

const WELCOME_TEXT =
  "Hi — I’m your Aptus assistant. Please share your name, email, and phone number so an expert can follow up, then tell me what you need.";

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

function interestFromText(input: string): InterestOption | undefined {
  const q = input.toLowerCase();
  if (/elv|security|cctv|access|cabling|data center|networking|ups|smatv/.test(q)) {
    return INTEREST_OPTIONS.find((o) => o.family === "elv");
  }
  if (/train|support|course|learn|matlab|turnitin|spss|ansys/.test(q)) {
    return INTEREST_OPTIONS.find((o) => o.family === "educational");
  }
  if (/engineer|bim|revit|civil|digital|autocad|navisworks|autodesk/.test(q)) {
    return INTEREST_OPTIONS.find((o) => o.family === "autodesk");
  }
  if (/software|license|adobe|oracle|microsoft|product/.test(q)) {
    return INTEREST_OPTIONS.find((o) => o.family === "software-licensing");
  }
  return INTEREST_OPTIONS.find((o) => o.label.toLowerCase() === q);
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
  const [savingContact, setSavingContact] = useState(false);
  const [interestFamily, setInterestFamily] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "bot",
      text: WELCOME_TEXT,
    },
  ]);

  const productContext: QuoteModalContext = useMemo(() => {
    if (interestFamily) return quoteContextForFamily(interestFamily);
    return quoteContextFromPathname(pathname);
  }, [interestFamily, pathname]);

  const productOptions = productContext.products;

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
  }, [messages, open, contactCaptured, contactError, interestFamily, productOptions.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const submitContact = async (e: FormEvent) => {
    e.preventDefault();
    if (savingContact) return;

    const name = contact.name.trim();
    const email = contact.email.trim();
    const phone = normalizePhone(contact.phone.trim());

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
    setSavingContact(true);

    try {
      // Same-origin proxy → backend CRM (avoids CORS / wrong NEXT_PUBLIC_API_URL in browser)
      const res = await fetch("/api/talk-to-expert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        errors?: Record<string, string>;
        crmSynced?: boolean;
        ok?: boolean;
        leadId?: number;
        odooHost?: string;
        stageName?: string;
      };

      if (!res.ok) {
        let msg =
          "We couldn't save your details right now. Please try again.";
        if (typeof data.error === "string" && data.error) msg = data.error;
        else if (data.errors) {
          msg =
            data.errors.name ||
            data.errors.email ||
            data.errors.phone ||
            data.errors._form ||
            msg;
        }
        setContactError(msg);
        return;
      }

      const crmSynced = data.crmSynced !== false;
      const leadHint =
        typeof data.leadId === "number"
          ? ` (CRM #${data.leadId}${data.odooHost ? ` on ${data.odooHost}` : ""})`
          : "";

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
          text: crmSynced
            ? `Thanks, ${name.split(/\s+/)[0] || name}! Your details were saved${leadHint}. Choose a category below and I’ll show the matching products.`
            : `Thanks, ${name.split(/\s+/)[0] || name}! We saved your details for follow-up. Choose a category below and I’ll show the matching products.`,
        },
      ]);
    } catch {
      setContactError("Network error. Please check your connection and try again.");
    } finally {
      setSavingContact(false);
    }
  };

  const selectInterest = (option: InterestOption) => {
    if (!contactCaptured) return;
    setInterestFamily(option.family);
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "user", text: option.label },
      { id: uid(), role: "bot", text: option.intro },
    ]);
    setInput("");
  };

  const selectProduct = (product: string) => {
    if (!contactCaptured || !interestFamily) return;
    const context = quoteContextForFamily(interestFamily);
    openQuote({
      ...context,
      defaultProduct: context.products.includes(product) ? product : product,
    });
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "user", text: product },
      {
        id: uid(),
        role: "bot",
        text: `Opening a quote request for ${product}. You can also keep chatting if you need anything else.`,
      },
    ]);
  };

  const pushUser = (text: string) => {
    if (!contactCaptured) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    const matchedInterest = interestFromText(trimmed);
    if (matchedInterest) {
      selectInterest(matchedInterest);
      return;
    }

    if (interestFamily) {
      const products = quoteContextForFamily(interestFamily).products;
      const productMatch = products.find(
        (product) => product.toLowerCase() === trimmed.toLowerCase(),
      );
      if (productMatch) {
        selectProduct(productMatch);
        setInput("");
        return;
      }
    }

    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "user", text: trimmed },
      {
        id: uid(),
        role: "bot",
        text: interestFamily
          ? "Thanks — pick a product from the list above, or use Request a Quote to send full details."
          : "Please choose Software licensing, ELV & security, Digital engineering, or Training & support so I can show the right products.",
      },
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
                Name *
                <input
                  ref={nameRef}
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={contact.name}
                  disabled={savingContact}
                  onChange={(e) =>
                    setContact((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </label>
              <label className="aptus-expert-chat__field">
                Email *
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={contact.email}
                  disabled={savingContact}
                  onChange={(e) =>
                    setContact((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </label>
              <label className="aptus-expert-chat__field">
                Phone *
                <input
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  value={contact.phone}
                  disabled={savingContact}
                  onChange={(e) =>
                    setContact((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
              </label>
              {contactError ? (
                <p className="aptus-expert-chat__lead-error" role="alert">
                  {contactError}
                </p>
              ) : null}
              <button
                type="submit"
                className="aptus-expert-chat__lead-submit"
                disabled={savingContact}
              >
                {savingContact ? "Saving…" : "Continue"}
              </button>
            </form>
          ) : (
            <>
              <div className="aptus-expert-chat__quick" aria-label="Interest categories">
                {INTEREST_OPTIONS.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    className={
                      interestFamily === option.family
                        ? "aptus-expert-chat__chip is-active"
                        : "aptus-expert-chat__chip"
                    }
                    onClick={() => selectInterest(option)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {interestFamily && productOptions.length ? (
                <div className="aptus-expert-chat__products">
                  <p className="aptus-expert-chat__products-label">Products</p>
                  <div className="aptus-expert-chat__product-list" role="list">
                    {productOptions.map((product) => (
                      <button
                        key={product}
                        type="button"
                        role="listitem"
                        className="aptus-expert-chat__product"
                        onClick={() => selectProduct(product)}
                      >
                        {product}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="aptus-expert-chat__actions">
                <a
                  href="https://wa.me/96891234567"
                  className="aptus-expert-chat__action"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
                <button
                  type="button"
                  className="aptus-expert-chat__action aptus-expert-chat__action--primary"
                  onClick={() => openQuote(productContext)}
                >
                  Request a Quote
                </button>
              </div>
            </>
          )}
        </div>

        {contactCaptured ? (
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
              className="aptus-expert-chat__input"
              placeholder="Type your message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="aptus-expert-chat__send" aria-label="Send message">
              Send
            </button>
          </form>
        ) : (
          <p className="aptus-expert-chat__gate-hint">
            Enter your name, email, and phone to start chatting with an expert.
          </p>
        )}
      </div>
    </div>
  );
}
